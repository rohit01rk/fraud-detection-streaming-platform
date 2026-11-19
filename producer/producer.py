"""Python transaction producer - simulates diverse profiles + edge cases (Proposal §3).
Run locally with the docker-compose stack; the Vercel demo uses lib/engine.ts with identical logic."""
import json, random, time, uuid
SCENARIOS=["Normal","Normal","Normal","Normal","High-Value Spike","Geo-Velocity Violation","Micro-Burst"]
def make_txn():
    return {"id": f"TXN-{uuid.uuid4().hex[:8]}", "ts": int(time.time()*1000), "amount": round(random.uniform(120,6000),2), "scenario": random.choice(SCENARIOS)}
if __name__=="__main__":
    print("Producer ready - connect KafkaProducer(bootstrap_servers=KAFKA_BOOTSTRAP) and send to transactions.raw")
    while True:
        print(json.dumps(make_txn())); time.sleep(0.9)
