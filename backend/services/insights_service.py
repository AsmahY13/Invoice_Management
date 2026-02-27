from sqlalchemy.orm import Session
from sqlalchemy import func, extract, and_
import models
from datetime import datetime, timedelta
import numpy as np
from collections import defaultdict

class InsightsService:
    def __init__(self, db: Session):
        self.db = db
    
    def get_spending_insights(self, start_date: str = None, end_date: str = None) -> dict:
        """Generate AI-powered insights from FINAL APPROVED documents only"""
        
        # Build query - ONLY FINAL APPROVED DOCUMENTS
        query = self.db.query(models.Document).filter(
            and_(
                models.Document.status == "approved",  # Final approval
                models.Document.is_duplicate == False,  # Exclude duplicates
                models.Document.amount > 0  # Only positive amounts
            )
        )
        
        # Apply date filters
        if start_date:
            try:
                start = datetime.fromisoformat(start_date)
                query = query.filter(models.Document.date >= start)
            except:
                pass
        
        if end_date:
            try:
                end = datetime.fromisoformat(end_date)
                query = query.filter(models.Document.date <= end)
            except:
                pass
        
        # Get the documents
        documents = query.all()
        
        print(f"📊 Insights: Found {len(documents)} FINAL APPROVED documents")
        
        if not documents:
            return {
                "message": "No approved documents found for the selected period",
                "summary": {
                    "total_spend": 0,
                    "average_invoice": 0,
                    "document_count": 0
                },
                "trends": {"monthly_trends": []},
                "anomalies": [],
                "vendor_analysis": {"top_vendors": []},
                "forecast": {"message": "Insufficient data for forecast"}
            }
        
        # Convert to list of dicts for analysis
        data = []
        for d in documents:
            # Skip if amount is None or zero
            if not d.amount or d.amount <= 0:
                continue
                
            data.append({
                'id': d.id,
                'vendor': d.vendor or 'Unknown',
                'amount': float(d.amount),
                'vat': float(d.vat_amount) if d.vat_amount else 0,
                'date': d.date,
                'month': d.date.strftime('%Y-%m') if d.date else None,
                'invoice_number': d.invoice_number,
                'document_type': d.document_type
            })
        
        print(f"📊 Insights: Processed {len(data)} valid documents for analysis")
        
        # Calculate insights
        insights = {
            "summary": self._get_summary(data),
            "trends": self._analyze_trends(data),
            "anomalies": self._detect_anomalies(data),
            "vendor_analysis": self._analyze_vendors(data),
            "forecast": self._simple_forecast(data),
            "filters_applied": {
                "start_date": start_date,
                "end_date": end_date,
                "status": "approved",
                "excluded_duplicates": True
            }
        }
        
        return insights
    
    def get_workflow_insights(self, start_date: str = None, end_date: str = None) -> dict:
        """Get insights about workflow efficiency"""
        
        # Base query
        query = self.db.query(models.Document)
        
        if start_date:
            query = query.filter(models.Document.upload_date >= datetime.fromisoformat(start_date))
        if end_date:
            query = query.filter(models.Document.upload_date <= datetime.fromisoformat(end_date))
        
        documents = query.all()
        
        # Calculate workflow metrics
        total = len(documents)
        approved = sum(1 for d in documents if d.status == "approved")
        rejected = sum(1 for d in documents if d.status == "rejected")
        pending = sum(1 for d in documents if d.status == "pending_review")
        
        # Calculate average approval time (for approved documents)
        approval_times = []
        for d in documents:
            if d.status == "approved" and d.upload_date and d.approval_date:
                time_taken = (d.approval_date - d.upload_date).total_seconds() / 3600  # hours
                approval_times.append(time_taken)
        
        avg_approval_time = np.mean(approval_times) if approval_times else 0
        
        return {
            "workflow_summary": {
                "total_documents": total,
                "approved": approved,
                "rejected": rejected,
                "pending": pending,
                "approval_rate": (approved / total * 100) if total > 0 else 0,
                "rejection_rate": (rejected / total * 100) if total > 0 else 0
            },
            "approval_efficiency": {
                "average_approval_time_hours": round(avg_approval_time, 2),
                "average_approval_time_days": round(avg_approval_time / 24, 2),
                "fastest_approval_hours": min(approval_times) if approval_times else 0,
                "slowest_approval_hours": max(approval_times) if approval_times else 0
            }
        }
    
    def get_vendor_performance(self, vendor: str = None) -> dict:
        """Get detailed performance metrics for specific vendor(s)"""
        
        query = self.db.query(models.Document).filter(
            models.Document.status == "approved"
        )
        
        if vendor:
            query = query.filter(models.Document.vendor.ilike(f"%{vendor}%"))
        
        documents = query.all()
        
        if not documents:
            return {"message": "No data found for vendor"}
        
        # Group by vendor
        vendor_data = defaultdict(lambda: {
            'total_spent': 0,
            'count': 0,
            'amounts': [],
            'dates': [],
            'invoice_numbers': []
        })
        
        for d in documents:
            if d.vendor and d.amount:
                vendor_data[d.vendor]['total_spent'] += d.amount
                vendor_data[d.vendor]['count'] += 1
                vendor_data[d.vendor]['amounts'].append(d.amount)
                vendor_data[d.vendor]['dates'].append(d.date)
                vendor_data[d.vendor]['invoice_numbers'].append(d.invoice_number)
        
        # Calculate statistics for each vendor
        result = []
        for v_name, v_stats in vendor_data.items():
            amounts = v_stats['amounts']
            result.append({
                'vendor': v_name,
                'total_spent': v_stats['total_spent'],
                'transaction_count': v_stats['count'],
                'average_transaction': np.mean(amounts) if amounts else 0,
                'max_transaction': max(amounts) if amounts else 0,
                'min_transaction': min(amounts) if amounts else 0,
                'std_deviation': np.std(amounts) if len(amounts) > 1 else 0,
                'last_transaction_date': max(v_stats['dates']) if v_stats['dates'] else None,
                'last_invoice': v_stats['invoice_numbers'][-1] if v_stats['invoice_numbers'] else None
            })
        
        # Sort by total spent
        result.sort(key=lambda x: x['total_spent'], reverse=True)
        
        return {
            "vendors": result,
            "total_vendors": len(result),
            "total_spend_all": sum(v['total_spent'] for v in result)
        }
    
    def _get_summary(self, data: list) -> dict:
        """Basic summary statistics"""
        if not data:
            return {
                "total_spend": 0,
                "average_invoice": 0,
                "median_invoice": 0,
                "max_invoice": 0,
                "min_invoice": 0,
                "total_vat": 0,
                "document_count": 0
            }
        
        amounts = [d['amount'] for d in data if d['amount'] > 0]
        
        if not amounts:
            return {
                "total_spend": 0,
                "average_invoice": 0,
                "median_invoice": 0,
                "max_invoice": 0,
                "min_invoice": 0,
                "total_vat": 0,
                "document_count": len(data)
            }
        
        return {
            "total_spend": sum(amounts),
            "average_invoice": float(np.mean(amounts)),
            "median_invoice": float(np.median(amounts)),
            "max_invoice": float(max(amounts)),
            "min_invoice": float(min(amounts)),
            "total_vat": float(sum(d['vat'] for d in data if d['vat'])),
            "document_count": len(data)
        }
    
    def _analyze_trends(self, data: list) -> dict:
        """Analyze spending trends over time"""
        if not data:
            return {"monthly_trends": [], "overall_trend_percent": 0, "trend_direction": "stable"}
        
        # Group by month
        monthly = defaultdict(lambda: {'total': 0, 'count': 0})
        for d in data:
            if d['month']:
                monthly[d['month']]['total'] += d['amount']
                monthly[d['month']]['count'] += 1
        
        # Sort by month
        months = sorted(monthly.keys())
        
        # Calculate month-over-month changes
        trends = []
        prev_total = None
        for month in months:
            current = monthly[month]['total']
            if prev_total is not None and prev_total > 0:
                change = ((current - prev_total) / prev_total) * 100
                trends.append({
                    "month": month,
                    "total": round(current, 2),
                    "count": monthly[month]['count'],
                    "change_percent": round(change, 2)
                })
            else:
                trends.append({
                    "month": month,
                    "total": round(current, 2),
                    "count": monthly[month]['count'],
                    "change_percent": 0
                })
            prev_total = current
        
        # Calculate overall trend
        if len(trends) >= 2:
            first = trends[0]['total']
            last = trends[-1]['total']
            overall_change = ((last - first) / first) * 100 if first > 0 else 0
        else:
            overall_change = 0
        
        return {
            "monthly_trends": trends,
            "overall_trend_percent": round(overall_change, 2),
            "trend_direction": "increasing" if overall_change > 5 else "decreasing" if overall_change < -5 else "stable"
        }
    
    def _detect_anomalies(self, data: list) -> list:
        """Detect unusual transactions using statistical methods"""
        if len(data) < 5:
            return []
        
        amounts = [d['amount'] for d in data if d['amount'] > 0]
        if len(amounts) < 5:
            return []
        
        mean = np.mean(amounts)
        std = np.std(amounts)
        
        if std == 0:
            return []
        
        # Flag transactions more than 2 standard deviations from mean
        anomalies = []
        for d in data:
            if d['amount'] <= 0:
                continue
                
            z_score = (d['amount'] - mean) / std
            if abs(z_score) > 2:  # Unusual transaction
                anomalies.append({
                    "vendor": d['vendor'],
                    "amount": float(d['amount']),
                    "date": str(d['date']) if d['date'] else None,
                    "invoice_number": d.get('invoice_number'),
                    "reason": f"Amount is {abs(z_score):.1f} standard deviations from average",
                    "severity": "high" if abs(z_score) > 3 else "medium",
                    "z_score": float(z_score)
                })
        
        return anomalies
    
    def _analyze_vendors(self, data: list) -> dict:
        """Analyze spending by vendor"""
        vendor_stats = defaultdict(lambda: {'total': 0, 'count': 0, 'amounts': []})
        
        for d in data:
            if d['amount'] > 0:
                vendor_stats[d['vendor']]['total'] += d['amount']
                vendor_stats[d['vendor']]['count'] += 1
                vendor_stats[d['vendor']]['amounts'].append(d['amount'])
        
        if not vendor_stats:
            return {
                "top_vendors": [],
                "vendor_count": 0,
                "concentration": 0
            }
        
        # Calculate averages and prepare results
        vendors = []
        total_spend_all = sum(stats['total'] for stats in vendor_stats.values())
        
        for vendor, stats in vendor_stats.items():
            vendors.append({
                "name": vendor,
                "total_spend": round(stats['total'], 2),
                "transaction_count": stats['count'],
                "average_transaction": round(stats['total'] / stats['count'], 2) if stats['count'] > 0 else 0,
                "percentage_of_total": round((stats['total'] / total_spend_all * 100), 2) if total_spend_all > 0 else 0
            })
        
        # Sort by total spend
        vendors.sort(key=lambda x: x['total_spend'], reverse=True)
        
        # Calculate concentration (percentage from top vendor)
        concentration = vendors[0]['percentage_of_total'] if vendors else 0
        
        return {
            "top_vendors": vendors[:10],  # Top 10 vendors
            "vendor_count": len(vendors),
            "concentration": concentration,
            "total_spend_all": round(total_spend_all, 2)
        }
    
    def _simple_forecast(self, data: list) -> dict:
        """Simple forecast for next month based on average growth"""
        if len(data) < 3:
            return {
                "message": "Insufficient data for forecast",
                "next_month_forecast": 0,
                "confidence": "low"
            }
        
        # Group by month
        monthly = defaultdict(float)
        for d in data:
            if d['month'] and d['amount'] > 0:
                monthly[d['month']] += d['amount']
        
        months = sorted(monthly.keys())
        if len(months) < 2:
            return {
                "message": "Insufficient monthly data",
                "next_month_forecast": 0,
                "confidence": "low"
            }
        
        # Calculate average monthly growth
        growth_rates = []
        for i in range(1, len(months)):
            prev = monthly[months[i-1]]
            curr = monthly[months[i]]
            if prev > 0:
                growth = ((curr - prev) / prev) * 100
                growth_rates.append(growth)
        
        avg_growth = np.mean(growth_rates) if growth_rates else 0
        
        # Forecast next month
        last_month = months[-1]
        last_amount = monthly[last_month]
        
        # Only forecast if we have reasonable data
        if last_amount <= 0 or abs(avg_growth) > 100:  # Cap extreme growth
            forecast = last_amount
            confidence = "low"
        else:
            forecast = last_amount * (1 + avg_growth/100)
            confidence = "medium" if len(months) >= 3 else "low"
        
        # Parse next month
        try:
            year, month = map(int, last_month.split('-'))
            if month == 12:
                next_month = f"{year+1}-01"
            else:
                next_month = f"{year}-{month+1:02d}"
        except:
            next_month = "unknown"
        
        return {
            "next_month_forecast": round(max(0, forecast), 2),  # Ensure non-negative
            "forecast_month": next_month,
            "confidence": confidence,
            "based_on_growth_rate": round(avg_growth, 2) if not pd.isna(avg_growth) else 0,
            "months_analyzed": len(months)
        }