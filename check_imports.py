
try:
    print("Attempting to import api.index...")
    from api.index import app
    print("Successfully imported api.index:app")
except Exception as e:
    print(f"FAILED to import api.index: {e}")
    import traceback
    traceback.print_exc()
