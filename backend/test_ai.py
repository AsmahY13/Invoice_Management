from services.extraction_service import InvoiceExtractor
import os

print("="*60)
print("🧪 AI EXTRACTION TEST")
print("="*60)

# Create extractor
extractor = InvoiceExtractor()

# Ask for a test file
print("\n📂 Place a sample invoice PDF in your backend folder")
test_file = input("Enter the filename (e.g., invoice.pdf): ").strip()

# Check if file exists
if os.path.exists(test_file):
    print(f"\n🔍 Testing extraction on: {test_file}")
    
    # Run extraction
    result = extractor.extract_from_pdf(test_file)
    
    # Show results
    print("\n" + "="*60)
    print("📊 EXTRACTION RESULTS")
    print("="*60)
    for key, value in result.items():
        if key != 'raw_text':
            print(f"{key:20}: {value}")
    print("="*60)
    
    # Success check
    if result.get('invoice_number') and result.get('invoice_number') != 'Unknown':
        print("\n✅✅✅ SUCCESS! AI extracted real data!")
    else:
        print("\n⚠️ Couldn't extract specific fields. Try a different invoice format.")
        
else:
    print(f"\n❌ File not found: {test_file}")
    print("Make sure the file is in your backend folder")

print("\n✨ Test complete!")