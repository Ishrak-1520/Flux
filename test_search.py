
import asyncio
from api.agent_search import perform_market_research

async def main():
    print("Testing perform_market_research...")
    query = "AI-powered coffee machine"
    result = await perform_market_research(query)
    print("\nSearch Result:")
    print(result)

if __name__ == "__main__":
    asyncio.run(main())
