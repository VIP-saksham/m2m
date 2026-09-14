from datetime import date, timedelta

from app import create_app, db

from app.models.user import User
from app.models.batch import ProduceBatch
from app.models.demand import ProcessorDemand

from app.services.assessment_service import AssessmentService
from app.services.decision_engine import run_decision_engine
from app.services.matching_engine import run_matching


# ---------------------------------------------------------
# CREATE FLASK APPLICATION
# ---------------------------------------------------------

flask_app = create_app()


# ---------------------------------------------------------
# SEED DATABASE
# ---------------------------------------------------------

def seed_db():
    """
    Reset database and insert demo data.
    """

    with flask_app.app_context():

        print("Resetting database...")

        # Reset database tables
        db.drop_all()
        db.create_all()

        # -------------------------------------------------
        # CREATE USERS
        # -------------------------------------------------

        print("\nCreating users...")

        users_data = [
            {
                "name": "Admin",
                "email": "admin@m2m.demo",
                "phone": "9999999990",
                "role": "admin",
                "password": "Admin@123",
                "status": "verified",
            },
            {
                "name": "Farmer A",
                "email": "farmer_a@m2m.demo",
                "phone": "9999999991",
                "role": "farmer",
                "password": "Farmer@123",
                "status": "verified",
            },
            {
                "name": "Farmer B",
                "email": "farmer_b@m2m.demo",
                "phone": "9999999992",
                "role": "farmer",
                "password": "Farmer@123",
                "status": "verified",
            },
            {
                "name": "Farmer C",
                "email": "farmer_c@m2m.demo",
                "phone": "9999999993",
                "role": "farmer",
                "password": "Farmer@123",
                "status": "verified",
            },
            {
                "name": "Farmer D",
                "email": "farmer_d@m2m.demo",
                "phone": "9999999994",
                "role": "farmer",
                "password": "Farmer@123",
                "status": "verified",
            },
            {
                "name": "Farmer E",
                "email": "farmer_e@m2m.demo",
                "phone": "9999999995",
                "role": "farmer",
                "password": "Farmer@123",
                "status": "verified",
            },
            {
                "name": "Farmer F",
                "email": "farmer_f@m2m.demo",
                "phone": "9999999996",
                "role": "farmer",
                "password": "Farmer@123",
                "status": "unverified",
            },
            {
                "name": "Processor",
                "email": "processor@m2m.demo",
                "phone": "9999999999",
                "role": "processor",
                "password": "Processor@123",
                "status": "verified",
            },
            {
                "name": "Buyer",
                "email": "buyer@m2m.demo",
                "phone": "9999999988",
                "role": "buyer",
                "password": "Buyer@123",
                "status": "verified",
            },
        ]

        users = {}

        for user_data in users_data:

            user = User(
                name=user_data["name"],
                email=user_data["email"],
                phone=user_data["phone"],
                role=user_data["role"],
                verification_status=user_data["status"],
            )

            user.set_password(user_data["password"])

            db.session.add(user)
            db.session.commit()

            users[user_data["name"]] = user

            print(
                f"Created user: {user_data['name']}"
            )

        # -------------------------------------------------
        # CREATE PRODUCE BATCHES
        # -------------------------------------------------

        print("\nCreating produce batches...")

        today = date.today()

        batches_data = [
            {
                "code": "BAT001",
                "farmer": "Farmer A",
                "qty": 500,
                "quality": "A",
                "spoilage": "",
            },
            {
                "code": "BAT002",
                "farmer": "Farmer B",
                "qty": 2000,
                "quality": "B",
                "spoilage": "",
            },
            {
                "code": "BAT003",
                "farmer": "Farmer C",
                "qty": 1500,
                "quality": "A",
                "spoilage": "",
            },
            {
                "code": "BAT004",
                "farmer": "Farmer D",
                "qty": 3000,
                "quality": "B",
                "spoilage": "",
            },
            {
                "code": "BAT005",
                "farmer": "Farmer E",
                "qty": 3000,
                "quality": "A",
                "spoilage": "",
            },
            {
                "code": "BAT006",
                "farmer": "Farmer F",
                "qty": 2000,
                "quality": "C",
                "spoilage": "showing signs of rot",
            },
        ]

        for batch_data in batches_data:

            batch = ProduceBatch(
                batch_code=batch_data["code"],
                farmer_id=users[batch_data["farmer"]].id,
                crop="Tomato",
                quantity=batch_data["qty"],
                harvest_date=today - timedelta(days=2),
                availability_start=today,
                availability_end=today + timedelta(days=7),
                initial_quality_estimate=batch_data["quality"],
                spoilage_signs=batch_data["spoilage"],
                status="draft",
                is_demo=True,
            )

            db.session.add(batch)
            db.session.commit()

            print(
                f"\nAssessing and deciding for "
                f"{batch_data['code']}..."
            )

            # Run quality assessment
            AssessmentService().run(batch.id)

            # Mark batch as available
            batch.status = "available"
            db.session.commit()

            # Run decision engine
            run_decision_engine(batch.id)

            print(
                f"Completed batch: {batch_data['code']}"
            )

        # -------------------------------------------------
        # CREATE PROCESSOR DEMAND
        # -------------------------------------------------

        print("\nCreating processor demand...")

        demand = ProcessorDemand(
            demand_code="DEM001",
            processor_id=users["Processor"].id,
            crop="Tomato",
            required_quantity=10000,
            unit="kg",
            minimum_quality="B",
            deadline=today + timedelta(days=3),
            is_demo=True,
        )

        db.session.add(demand)
        db.session.commit()

        print("Created demand: DEM001")

        # -------------------------------------------------
        # RUN MATCHING ENGINE
        # -------------------------------------------------

        print("\nRunning matching engine...")

        run_matching(demand.id)

        # -------------------------------------------------
        # COMPLETE
        # -------------------------------------------------

        print("\n" + "=" * 55)
        print("DATABASE SEEDING COMPLETED SUCCESSFULLY")
        print("=" * 55)

        print("\nDemo login credentials:")

        print(
            "Admin     : admin@m2m.demo / Admin@123"
        )

        print(
            "Farmer A  : farmer_a@m2m.demo / Farmer@123"
        )

        print(
            "Farmer B  : farmer_b@m2m.demo / Farmer@123"
        )

        print(
            "Processor : processor@m2m.demo / Processor@123"
        )

        print(
            "Buyer     : buyer@m2m.demo / Buyer@123"
        )

        print("\nRun the backend using:")
        print("python run.py")


# ---------------------------------------------------------
# RUN SCRIPT
# ---------------------------------------------------------

if __name__ == "__main__":
    seed_db()