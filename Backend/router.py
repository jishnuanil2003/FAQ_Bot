from semantic_router import Route
from semantic_router.layer import RouteLayer
from semantic_router.encoders import HuggingFaceEncoder

# Encoder
encoder = HuggingFaceEncoder(
    name="sentence-transformers/all-MiniLM-L6-v2"
)

# FAQ Route
faq = Route(
    name="faq",
    utterances=[
        "What is the return policy of the products?",
        "How can I track my order?",
        "How long does it take to process a refund?",
        "What should I do if I receive a defective product?",
        "My product is damaged",
        "I received a broken item",
        "How can I replace a defective product?",
        "Can I return a damaged product?",
        "Product replacement policy"
        "What all are the different payment methods you offer?",
        "What is your return policy?",
        "How do I track my order?", 
    ]
)

# SQL/Product Route
sql = Route(
    name="sql",
    utterances=[
        "Show me Nike shoes",
        "Shoes under 3000 rupees",
        "Best rated Puma shoes",
        "Running shoes for women",
        "Top 5 shoes by rating",
        "Products with more than 20 percent discount",
        "Show me names of three products with highest ratings",
    ]
)

fallback = Route(
    name="fallback",
    utterances=[
        "hello",
        "hi",
        "good morning"
    ]
)

# Create Route Layer
router = RouteLayer(
    routes=[faq, sql,fallback],
    encoder=encoder,
)

if __name__ == "__main__":

    query1 = "What is your policy on defective product?"
    query2 = "Pink Puma shoes in price range 5000 to 1000"

    result1 = router(query1)
    result2 = router(query2)

    print("Query 1 Route:", result1.name)
    print("Query 2 Route:", result2.name)