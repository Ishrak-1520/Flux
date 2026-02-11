# api/agent_search.py
from ddgs import DDGS
import asyncio

async def perform_market_research(query_context):
    """
    1. Generates search queries based on the user's idea.
    2. Searches the web for real competitors and trends.
    3. Returns a factual summary to feed into the AI Engine.
    """
    print(f"🕵️ Agent Search: Researching '{query_context}'...")
    
    # 1. Search Logic (Using lightweight DuckDuckGo)
    # DDGS is synchronous by default, but we can wrapping it or just use it directly if it's fast enough.
    # The library might have async support or we run it in a thread if needed, 
    # but for now we'll stick to the simple implementation provided.
    
    competitors = []
    tech_trends = []
    
    try:
        with DDGS() as ddgs:
            # Search for competitors
            competitors_gen = ddgs.text(f"{query_context} competitors and similar products 2024", max_results=4)
            if competitors_gen:
                competitors = list(competitors_gen)
            
            # Search for technical trends
            trends_gen = ddgs.text(f"best tech stack for {query_context} 2024", max_results=3)
            if trends_gen:
                tech_trends = list(trends_gen)
    except Exception as e:
        print(f"⚠️ Search Error: {e}")
        return "### REAL-TIME MARKET DATA ###\n(Search failed, proceeding with internal knowledge.)"

    # 2. Synthesize Data
    research_summary = "### REAL-TIME MARKET DATA ###\n"
    
    if competitors:
        research_summary += "COMPETITORS FOUND:\n"
        for r in competitors:
            title = r.get('title', 'Unknown')
            body = r.get('body', 'No description')
            href = r.get('href', '#')
            research_summary += f"- {title}: {body} (Source: {href})\n"
    else:
        research_summary += "No specific competitors found via search.\n"
        
    if tech_trends:
        research_summary += "\nTECH TRENDS:\n"
        for r in tech_trends:
            title = r.get('title', 'Unknown')
            body = r.get('body', 'No description')
            research_summary += f"- {title}: {body}\n"
    else:
        research_summary += "\nNo specific tech trends found via search.\n"
        
    print("✅ Research Complete.")
    return research_summary
