export type Txn = {
  id: string; ts: number; userId: string; userName: string;
  amount: number; currency: string; merchant: string; category: string;
  city: string; region: string; lat: number; lon: number;
  method: "UPI"|"CARD"|"NETBANKING"|"WALLET";
  device: string; riskScore: number; status: "APPROVED"|"FLAGGED"|"BLOCKED";
  rules: string[]; scenario: string;
};

const NAMES=["Aarav Sharma","Priya Nair","Rohan Mehta","Sneha Iyer","Vikram Singh","Ananya Das","Karan Patel","Divya Rao","Arjun Malhotra","Meera Joshi","Nikhil Verma","Kavya Reddy","Rahul Gupta","Isha Kapoor","Manish Yadav","Pooja Bhatt","Sanjay Kumar","Neha Agarwal","Aditya Bose","Ritu Saxena"];
const MERCHANTS:[string,string][]=[["Amazon India","E-commerce"],["Swiggy","Food"],["Zomato","Food"],["Flipkart","E-commerce"],["IRCTC","Travel"],["MakeMyTrip","Travel"],["PhonePe Transfer","Transfer"],["ATM Withdrawal","Cash"],["Shell Petrol","Fuel"],["DMart","Grocery"],["Netflix","Subscription"],["Uber India","Travel"],["BigBasket","Grocery"],["Croma","Electronics"],["Apollo Pharmacy","Health"]];
const CITIES:[string,string,number,number][]=[["Mumbai","West",19.076,72.877],["Delhi","North",28.614,77.209],["Bengaluru","South",12.972,77.594],["Chennai","South",13.083,80.270],["Kolkata","East",22.573,88.364],["Hyderabad","South",17.385,78.487],["Pune","West",18.520,73.857],["Jaipur","North",26.912,75.787],["Lucknow","North",26.847,80.947],["Kochi","South",9.931,76.267]];
const pick=<T,>(a:T[])=>a[Math.floor(Math.random()*a.length)];
let seq=100000;
const uid=()=>`TXN-${++seq}`;
let burstUser:string|null=null, burstLeft=0, geoUser:string|null=null;

export function generateTxn(now=Date.now()): Txn {
  const scenarioRoll=Math.random();
  let scenario="Normal", userName=pick(NAMES), city=pick(CITIES), amount=Math.round((Math.random()*4500+120)*100)/100, merchant=pick(MERCHANTS);
  // Inject fraud scenarios ~18% of time, matching proposal edge cases
  if(scenarioRoll>0.82 && scenarioRoll<=0.87){ scenario="High-Value Spike"; amount=Math.round((Math.random()*120000+55000)*100)/100; }
  else if(scenarioRoll>0.87 && scenarioRoll<=0.92){ scenario="Geo-Velocity Violation"; geoUser=userName; city=pick(CITIES); amount=Math.round((Math.random()*8000+2000)*100)/100; }
  else if(scenarioRoll>0.92 && scenarioRoll<=0.96){ scenario="Micro-Burst"; if(!burstUser||burstLeft<=0){burstUser=userName;burstLeft=6;} userName=burstUser; burstLeft--; amount=Math.round((Math.random()*900+99)*100)/100; }
  else if(scenarioRoll>0.96){ scenario="Odd-Hour High Value"; amount=Math.round((Math.random()*60000+25000)*100)/100; }

  const [mName,mCat]=merchant; const [cityName,region,lat,lon]=city;
  const userId="USR-"+(NAMES.indexOf(userName)+1001);
  const rules:string[]=[]; let score=8+Math.random()*18;
  if(amount>50000){rules.push("R1 · Amount > ₹50,000"); score+=42;}
  else if(amount>25000){rules.push("R1b · Amount > ₹25,000"); score+=24;}
  if(scenario==="Geo-Velocity Violation"){rules.push("R3 · Geo-velocity: impossible travel"); score+=48;}
  if(scenario==="Micro-Burst"){rules.push("R2 · Velocity: burst in 10-min window"); score+=38;}
  if(scenario==="Odd-Hour High Value"){rules.push("R6 · Odd-hour + high value"); score+=30;}
  if(amount<150 && Math.random()>0.7){rules.push("R4 · Micro-transaction probing"); score+=16;}
  score=Math.min(99,Math.round(score));
  const status:Txn["status"]=score>=75?"BLOCKED":score>=45?"FLAGGED":"APPROVED";
  return {id:uid(),ts:now,userId,userName,amount,currency:"INR",merchant:mName,category:mCat,city:cityName,region,lat,lon,method:pick(["UPI","CARD","NETBANKING","WALLET"] as const),device:pick(["Android","iOS","Web"]),riskScore:score,status,rules,scenario};
}

export function generateBatch(n=24):Txn[]{ return Array.from({length:n},()=>generateTxn(Date.now()-Math.floor(Math.random()*60000))); }

export const RULES=[
 {id:"R1",name:"High-Value Threshold",desc:"Single transaction > ₹50,000 in one window",window:"Event-time",severity:"HIGH"},
 {id:"R2",name:"Velocity / Burst",desc:">5 transactions for same user in 10 minutes (Flink keyed window)",window:"10 min tumbling",severity:"HIGH"},
 {id:"R3",name:"Geo-Velocity",desc:"Two cities >500 km apart within 1 hour — impossible travel",window:"1 hr sliding",severity:"CRITICAL"},
 {id:"R4",name:"Micro-Probing",desc:"Repeated small-value test transactions before a large charge",window:"10 min",severity:"MEDIUM"},
 {id:"R5",name:"Amount Anomaly",desc:"Amount >3× user's 30-day average spend",window:"30 day profile",severity:"MEDIUM"},
 {id:"R6",name:"Odd-Hour High Value",desc:"High-value transaction between 01:00–04:00 local time",window:"Event-time",severity:"HIGH"},
];
export const DQ_CHECKS=[
 {name:"Schema validity (Avro / JSON Schema)",target:"Ingestion",pass:99.2},
 {name:"Null foreign keys = 0",target:"fact_transactions",pass:100},
 {name:"Uniqueness — transaction_id",target:"fact_transactions",pass:99.8},
 {name:"Amount distribution drift (PSI < 0.1)",target:"Monitoring",pass:97.4},
 {name:"Referential integrity — dim_user / dim_merchant",target:"dbt marts",pass:100},
 {name:"Freshness — max(event_time) < 60s",target:"Streaming",pass:98.6},
];
