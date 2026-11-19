import "./globals.css"; import type {Metadata} from "next";
export const metadata:Metadata={title:"FraudStream — Real-Time Fraud Detection Platform",description:"Production-grade distributed streaming platform: Kafka, Flink-style windowed rules, lakehouse, dbt star schema and live fraud alerting. CSE499 Capstone."};
export default function RootLayout({children}:{children:React.ReactNode}){return(<html lang="en"><body>{children}</body></html>)}
