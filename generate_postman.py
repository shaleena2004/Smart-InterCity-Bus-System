import json
import os

collection = {
    "info": {
        "name": "BookNGo Unified API",
        "description": "Comprehensive Postman Collection for all Book & Go backend API routes.",
        "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
    },
    "variable": [
        {
            "key": "baseUrl",
            "value": "https://smart-intercity-bus-system.onrender.com",
            "type": "string"
        }
    ],
    "item": []
}

routes = {
    "User": [
        ("Register User", "POST", "/user/register"),
        ("Login User", "POST", "/user/login"),
        ("Get Users", "GET", "/user/"),
        ("Update User", "PUT", "/user/:id"),
    ],
    "Supplier": [
        ("Create Supplier", "POST", "/supplier/"),
        ("Get All Suppliers", "GET", "/supplier/"),
        ("Get Supplier by ID", "GET", "/supplier/:id"),
        ("Update Supplier", "PUT", "/supplier/:id"),
        ("Delete Supplier", "DELETE", "/supplier/:id"),
    ],
    "Salary": [
        ("Add Salary", "POST", "/salary/"),
        ("Get All Salaries", "GET", "/salary/"),
        ("Get Salary by ID", "GET", "/salary/:id"),
        ("Update Salary", "PUT", "/salary/:id"),
        ("Delete Salary", "DELETE", "/salary/:id"),
    ],
    "Route": [
        ("Create Route", "POST", "/route/"),
        ("Get All Routes", "GET", "/route/"),
        ("Update Route", "PUT", "/route/:id"),
        ("Delete Route", "DELETE", "/route/:id"),
    ],
    "Revenue": [
        ("Add Revenue", "POST", "/revenue/"),
        ("Get All Revenue", "GET", "/revenue/"),
        ("Get Revenue Report", "GET", "/revenue/report"),
        ("Get Revenue by ID", "GET", "/revenue/:id"),
        ("Update Revenue", "PUT", "/revenue/:id"),
        ("Delete Revenue", "DELETE", "/revenue/:id"),
    ],
    "Revenue Allocation": [
        ("Create Allocation", "POST", "/revenue-allocation/"),
        ("Get Summary", "GET", "/revenue-allocation/summary"),
    ],
    "Performance": [
        ("Add Trip", "POST", "/performance/trip"),
        ("Add Incident", "POST", "/performance/incident"),
        ("Add Feedback", "POST", "/performance/feedback"),
        ("Add Complaint", "POST", "/performance/complaint"),
        ("Get Feedback", "GET", "/performance/feedback"),
        ("Get Complaints", "GET", "/performance/complaints"),
        ("Debug Trips", "GET", "/performance/debug-trips"),
        ("List All", "GET", "/performance/list-all"),
        ("Get Supplier Stats", "GET", "/performance/stats/:id"),
        ("Get Driver Stats", "GET", "/performance/driver-stats/:driverId"),
    ],
    "Booking": [
        ("Create Booking", "POST", "/booking/"),
        ("Get User Bookings", "GET", "/booking/user/:userId"),
        ("Get All Bookings", "GET", "/booking/"),
        ("Update Booking Status", "PATCH", "/booking/:id"),
        ("Cancel Booking", "PATCH", "/booking/:id/cancel"),
        ("Delete Booking", "DELETE", "/booking/:id"),
    ],
    "Bus": [
        ("Create Bus", "POST", "/bus/"),
        ("Get All Buses", "GET", "/bus/"),
        ("Get Bus by ID", "GET", "/bus/:id"),
        ("Update Bus", "PUT", "/bus/:id"),
        ("Delete Bus", "DELETE", "/bus/:id"),
    ],
    "Commission": [
        ("Add Commission", "POST", "/commission/"),
        ("Get All Commissions", "GET", "/commission/"),
        ("Get Commission by ID", "GET", "/commission/:id"),
        ("Update Commission", "PUT", "/commission/:id"),
        ("Delete Commission", "DELETE", "/commission/:id"),
    ],
}

for folder_name, endpoints in routes.items():
    folder = {
        "name": folder_name,
        "item": []
    }
    for name, method, path in endpoints:
        item = {
            "name": name,
            "request": {
                "method": method,
                "header": [{"key": "Content-Type", "value": "application/json"}],
                "url": {
                    "raw": "{{baseUrl}}" + path,
                    "host": ["{{baseUrl}}"],
                    "path": [p for p in path.split("/") if p]
                }
            },
            "response": []
        }
        
        if method in ["POST", "PUT", "PATCH"]:
            item["request"]["body"] = {
                "mode": "raw",
                "raw": "{\n    \n}"
            }
            
        folder["item"].append(item)
        
    collection["item"].append(folder)

with open('BookNGo_Postman_Collection.json', 'w') as f:
    json.dump(collection, f, indent=2)

print("Postman collection generated successfully.")
