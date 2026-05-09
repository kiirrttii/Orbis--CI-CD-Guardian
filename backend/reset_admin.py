import asyncio
from sqlalchemy import select
from app.database.session import AsyncSessionLocal
from app.models.user import User
from app.core.security import hash_password

async def reset_admin():
    async with AsyncSessionLocal() as db:
        admin_email = "admin@riskops.ai"
        admin_password = "RiskOps123"
        
        print(f"Resetting password for {admin_email}...")
        
        stmt = select(User).where(User.email == admin_email)
        result = await db.execute(stmt)
        user = result.scalars().first()
        
        if user:
            user.hashed_password = hash_password(admin_password)
            await db.commit()
            print("Password reset successfully!")
        else:
            print("Admin user not found. Creating new admin...")
            new_user = User(
                email=admin_email,
                hashed_password=hash_password(admin_password),
                full_name="RiskOps Admin",
                is_active=True
            )
            db.add(new_user)
            await db.commit()
            print("Admin user created successfully!")

if __name__ == "__main__":
    asyncio.run(reset_admin())
