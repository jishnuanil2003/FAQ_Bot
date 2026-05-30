from fastapi import FastAPI
from pydantic import BaseModel
from faq import ingest_faq_data, faq_chain
from pathlib import Path
from fastapi.middleware.cors import CORSMiddleware
from faq import ingest_faq_data, faq_chain
from sql import sql_chain
from router import router

app = FastAPI()

faq_path = Path(__file__).parent / "resources" / "faq_data.csv"

data = None

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Request body model
class QueryRequest(BaseModel):
    question: str


@app.on_event("startup")
async def startup_event():
    global data
    data = ingest_faq_data(faq_path)


@app.get("/")
async def root():
    return {"message": "Hello Its working"}


# POST endpoint
@app.post("/query")
async def process_query(request: QueryRequest):
    try:
        query = request.question.strip()

        if not query:
            return {
                "success": False,
                "message": "Please enter a valid question."
            }

        route_result = router(query)
        route_result = router(query)

        print("Query:", query)
        print("Route:", route_result)
        print("Route Name:", route_result.name)

        if route_result.name is None:
            return {
                "success": False,
                "message": "Sorry, I couldn't understand your request. Please ask about products or store FAQs."
            }

        if route_result.name == "faq":
            answer = faq_chain(query)

        elif route_result.name == "sql":
            answer = sql_chain(query)
        
        elif route_result.name == "fallback":
            answer = (
            "I can help with product searches and store FAQs. "
            "Try asking about products, discounts, prices, orders, or return policies."
    )
        else:
            return {
                "success": False,
                "message": "Sorry, this query type is not supported."
            }

        return {
            "success": True,
            "route": route_result.name,
            "query": query,
            "answer": answer
        }

    except Exception as e:
        return {
            "success": False,
            "message": f"An error occurred: {str(e)}"
        }