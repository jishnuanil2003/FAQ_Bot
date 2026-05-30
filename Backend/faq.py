import os
from pathlib import Path

import chromadb
import pandas as pd
from chromadb.utils.embedding_functions import SentenceTransformerEmbeddingFunction
from dotenv import load_dotenv
from groq import Groq
import warnings

# ignore dependency warnings
warnings.filterwarnings("ignore")
# Load environment variables
load_dotenv()

# Initialize embedding model
embedding_fn = SentenceTransformerEmbeddingFunction(
    model_name="sentence-transformers/all-MiniLM-L6-v2"
)

# Persistent ChromaDB client (Python 3.12 compatible)
chroma_client = chromadb.PersistentClient(path="./chroma_db")

# Groq client
groq_client = Groq(api_key=os.getenv("GROQ_API_KEY"))

COLLECTION_NAME = "faqs"

# Create or get collection
collection = chroma_client.get_or_create_collection(
    name=COLLECTION_NAME,
    embedding_function=embedding_fn
)


def ingest_faq_data(csv_path: str):
    """Load FAQ data into ChromaDB"""

    if collection.count() > 0:
        print("FAQ data already exists.")
        return

    print("Ingesting FAQ data...")

    df = pd.read_csv(csv_path)

    documents = df["question"].tolist()
    metadatas = [{"answer": ans} for ans in df["answer"].tolist()]
    ids = [f"id_{i}" for i in range(len(documents))]

    collection.add(
        documents=documents,
        metadatas=metadatas,
        ids=ids
    )

    print("FAQ data successfully ingested.")


def get_relevant_qa(query: str, n_results: int = 2):
    """Retrieve relevant FAQ entries"""

    return collection.query(
        query_texts=[query],
        n_results=n_results
    )


def generate_answer(query: str, context: str):
    """Generate answer using Groq LLM"""

    prompt = f"""
You are a helpful FAQ assistant.

Answer the question only from the given context.
If the answer is not available, reply with:
"I don't know."

CONTEXT:
{context}

QUESTION:
{query}

ANSWER:
"""

    response = groq_client.chat.completions.create(
        model=os.getenv("GROQ_MODEL", "llama3-8b-8192"),
        messages=[
            {
                "role": "user",
                "content": prompt
            }
        ],
        temperature=0
    )

    return response.choices[0].message.content.strip()


def faq_chain(query: str):
    """Complete FAQ pipeline"""

    result = get_relevant_qa(query)

    context = "\n".join(
        item.get("answer", "")
        for item in result["metadatas"][0]
    )

    print("\nContext:\n", context)

    return generate_answer(query, context)


if __name__ == "__main__":

    faq_path = Path(__file__).parent / "resources" / "faq_data.csv"

    ingest_faq_data(faq_path)

    query = "Do you take cash as a payment option?"

    answer = faq_chain(query)

    print("\nAnswer:\n", answer)