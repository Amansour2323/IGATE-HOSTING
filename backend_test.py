#!/usr/bin/env python3
"""
Backend API Testing for Igate-host Platform
Tests all API endpoints including auth, products, orders, invoices, and admin functionality
"""

import requests
import sys
import json
from datetime import datetime

class IgateHostAPITester:
    def __init__(self, base_url="https://igate-host.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.session = requests.Session()
        self.admin_token = None
        self.user_token = None
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []

    def log_test(self, name, success, details=""):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {name}")
        else:
            print(f"❌ {name} - {details}")
        
        self.test_results.append({
            "test": name,
            "success": success,
            "details": details
        })

    def test_api_root(self):
        """Test API root endpoint"""
        try:
            response = self.session.get(f"{self.api_url}/")
            success = response.status_code == 200
            details = f"Status: {response.status_code}"
            if success:
                data = response.json()
                details += f", Message: {data.get('message', 'N/A')}"
            self.log_test("API Root", success, details)
            return success
        except Exception as e:
            self.log_test("API Root", False, str(e))
            return False

    def test_seed_data(self):
        """Test seeding initial data"""
        try:
            response = self.session.post(f"{self.api_url}/seed")
            success = response.status_code == 200
            details = f"Status: {response.status_code}"
            if success:
                data = response.json()
                details += f", Message: {data.get('message', 'N/A')}"
            self.log_test("Seed Data", success, details)
            return success
        except Exception as e:
            self.log_test("Seed Data", False, str(e))
            return False

    def test_get_products(self):
        """Test getting products"""
        try:
            response = self.session.get(f"{self.api_url}/products")
            success = response.status_code == 200
            details = f"Status: {response.status_code}"
            if success:
                products = response.json()
                details += f", Products count: {len(products)}"
                # Check if hosting products exist
                hosting_products = [p for p in products if p.get('category') == 'hosting']
                details += f", Hosting products: {len(hosting_products)}"
            self.log_test("Get Products", success, details)
            return success, response.json() if success else []
        except Exception as e:
            self.log_test("Get Products", False, str(e))
            return False, []

    def test_admin_login(self):
        """Test admin login"""
        try:
            login_data = {
                "email": "admin@igate-host.com",
                "password": "admin123"
            }
            response = self.session.post(f"{self.api_url}/auth/login", json=login_data)
            success = response.status_code == 200
            details = f"Status: {response.status_code}"
            
            if success:
                data = response.json()
                self.admin_token = data.get('token')
                user_role = data.get('user', {}).get('role')
                details += f", Role: {user_role}, Token: {'Yes' if self.admin_token else 'No'}"
                
                # Set authorization header for future requests
                self.session.headers.update({'Authorization': f'Bearer {self.admin_token}'})
            
            self.log_test("Admin Login", success, details)
            return success
        except Exception as e:
            self.log_test("Admin Login", False, str(e))
            return False

    def test_admin_stats(self):
        """Test admin stats endpoint"""
        try:
            response = self.session.get(f"{self.api_url}/admin/stats")
            success = response.status_code == 200
            details = f"Status: {response.status_code}"
            
            if success:
                stats = response.json()
                details += f", Orders: {stats.get('total_orders', 0)}, Products: {stats.get('total_products', 0)}, Revenue: {stats.get('total_revenue', 0)}"
            
            self.log_test("Admin Stats", success, details)
            return success, response.json() if success else {}
        except Exception as e:
            self.log_test("Admin Stats", False, str(e))
            return False, {}

    def test_contact_form(self):
        """Test contact form submission"""
        try:
            contact_data = {
                "name": "Test User",
                "email": "test@example.com",
                "phone": "+201234567890",
                "message": "This is a test message from automated testing"
            }
            response = self.session.post(f"{self.api_url}/contact", json=contact_data)
            success = response.status_code == 200
            details = f"Status: {response.status_code}"
            
            if success:
                data = response.json()
                details += f", Message ID: {data.get('message_id', 'N/A')}"
            
            self.log_test("Contact Form", success, details)
            return success
        except Exception as e:
            self.log_test("Contact Form", False, str(e))
            return False

    def test_user_registration(self):
        """Test user registration"""
        try:
            # Generate unique email for testing
            timestamp = datetime.now().strftime("%H%M%S")
            user_data = {
                "name": "Test User",
                "email": f"testuser{timestamp}@example.com",
                "password": "testpass123"
            }
            response = self.session.post(f"{self.api_url}/auth/register", json=user_data)
            success = response.status_code == 200
            details = f"Status: {response.status_code}"
            
            if success:
                data = response.json()
                self.user_token = data.get('token')
                details += f", User ID: {data.get('user', {}).get('user_id', 'N/A')}"
            
            self.log_test("User Registration", success, details)
            return success, user_data if success else None
        except Exception as e:
            self.log_test("User Registration", False, str(e))
            return False, None

    def test_user_login(self, user_data):
        """Test user login with registered user"""
        if not user_data:
            self.log_test("User Login", False, "No user data available")
            return False
            
        try:
            login_data = {
                "email": user_data["email"],
                "password": user_data["password"]
            }
            response = self.session.post(f"{self.api_url}/auth/login", json=login_data)
            success = response.status_code == 200
            details = f"Status: {response.status_code}"
            
            if success:
                data = response.json()
                token = data.get('token')
                details += f", Token: {'Yes' if token else 'No'}"
            
            self.log_test("User Login", success, details)
            return success
        except Exception as e:
            self.log_test("User Login", False, str(e))
            return False

    def test_create_order(self, products):
        """Test creating an order"""
        if not products:
            self.log_test("Create Order", False, "No products available")
            return False, None
            
        try:
            # Use first hosting product
            hosting_products = [p for p in products if p.get('category') == 'hosting']
            if not hosting_products:
                self.log_test("Create Order", False, "No hosting products found")
                return False, None
                
            product = hosting_products[0]
            order_data = {
                "product_id": product["product_id"],
                "plan_duration": "monthly",
                "customer_name": "Test Customer",
                "customer_email": "testcustomer@example.com",
                "customer_phone": "+201234567890"
            }
            
            # Use user token for this request
            headers = {'Authorization': f'Bearer {self.user_token}'} if self.user_token else {}
            response = self.session.post(f"{self.api_url}/orders", json=order_data, headers=headers)
            success = response.status_code == 200
            details = f"Status: {response.status_code}"
            
            if success:
                order = response.json()
                details += f", Order ID: {order.get('order_id', 'N/A')}, Amount: {order.get('amount', 0)}"
                self.log_test("Create Order", success, details)
                return success, order
            else:
                self.log_test("Create Order", success, details)
                return False, None
                
        except Exception as e:
            self.log_test("Create Order", False, str(e))
            return False, None

    def test_mock_payment(self, order):
        """Test mock payment completion"""
        if not order:
            self.log_test("Mock Payment", False, "No order available")
            return False
            
        try:
            # First create payment session
            response = self.session.post(f"{self.api_url}/payments/create-session?order_id={order['order_id']}")
            if response.status_code != 200:
                self.log_test("Mock Payment", False, f"Payment session failed: {response.status_code}")
                return False
                
            payment_data = response.json()
            payment_id = payment_data.get('payment_id')
            
            if not payment_id:
                self.log_test("Mock Payment", False, "No payment ID returned")
                return False
            
            # Complete mock payment
            response = self.session.post(f"{self.api_url}/payments/mock-complete/{payment_id}")
            success = response.status_code == 200
            details = f"Status: {response.status_code}"
            
            if success:
                data = response.json()
                details += f", Invoice ID: {data.get('invoice_id', 'N/A')}"
            
            self.log_test("Mock Payment", success, details)
            return success
        except Exception as e:
            self.log_test("Mock Payment", False, str(e))
            return False

    def test_admin_orders(self):
        """Test admin orders endpoint"""
        try:
            response = self.session.get(f"{self.api_url}/admin/orders")
            success = response.status_code == 200
            details = f"Status: {response.status_code}"
            
            if success:
                orders = response.json()
                details += f", Orders count: {len(orders)}"
            
            self.log_test("Admin Orders", success, details)
            return success
        except Exception as e:
            self.log_test("Admin Orders", False, str(e))
            return False

    def test_admin_invoices(self):
        """Test admin invoices endpoint"""
        try:
            response = self.session.get(f"{self.api_url}/admin/invoices")
            success = response.status_code == 200
            details = f"Status: {response.status_code}"
            
            if success:
                invoices = response.json()
                details += f", Invoices count: {len(invoices)}"
                
                # Test PDF download if invoices exist
                if invoices:
                    invoice_id = invoices[0].get('invoice_id')
                    pdf_response = self.session.get(f"{self.api_url}/invoices/{invoice_id}/pdf")
                    pdf_success = pdf_response.status_code == 200
                    details += f", PDF Download: {'Success' if pdf_success else 'Failed'}"
            
            self.log_test("Admin Invoices", success, details)
            return success
        except Exception as e:
            self.log_test("Admin Invoices", False, str(e))
            return False

    def test_admin_messages(self):
        """Test admin contact messages endpoint"""
        try:
            response = self.session.get(f"{self.api_url}/admin/contact")
            success = response.status_code == 200
            details = f"Status: {response.status_code}"
            
            if success:
                messages = response.json()
                details += f", Messages count: {len(messages)}"
            
            self.log_test("Admin Messages", success, details)
            return success
        except Exception as e:
            self.log_test("Admin Messages", False, str(e))
            return False

    def run_all_tests(self):
        """Run all backend tests"""
        print("🚀 Starting Igate-host Backend API Tests")
        print("=" * 50)
        
        # Basic API tests
        if not self.test_api_root():
            print("❌ API Root failed - stopping tests")
            return False
            
        self.test_seed_data()
        
        # Products test
        products_success, products = self.test_get_products()
        if not products_success:
            print("❌ Products API failed - stopping tests")
            return False
        
        # Contact form test
        self.test_contact_form()
        
        # User registration and login
        reg_success, user_data = self.test_user_registration()
        if reg_success:
            self.test_user_login(user_data)
        
        # Admin login (required for admin endpoints)
        if not self.test_admin_login():
            print("❌ Admin login failed - skipping admin tests")
        else:
            # Admin endpoints
            self.test_admin_stats()
            self.test_admin_orders()
            self.test_admin_invoices()
            self.test_admin_messages()
            
            # Order and payment flow (requires user login)
            if self.user_token:
                order_success, order = self.test_create_order(products)
                if order_success:
                    self.test_mock_payment(order)
        
        # Print summary
        print("\n" + "=" * 50)
        print(f"📊 Test Summary: {self.tests_passed}/{self.tests_run} tests passed")
        
        if self.tests_passed == self.tests_run:
            print("🎉 All tests passed!")
            return True
        else:
            print("⚠️  Some tests failed. Check details above.")
            return False

def main():
    tester = IgateHostAPITester()
    success = tester.run_all_tests()
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())