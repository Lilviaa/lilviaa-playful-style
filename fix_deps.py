import os
import glob

def fix_file(filepath, auth_dependency):
    with open(filepath, 'r') as f:
        content = f.read()

    if f"APIRouter(dependencies=[Depends({auth_dependency})])" in content:
        content = content.replace(f"APIRouter(dependencies=[Depends({auth_dependency})])", "APIRouter()")
        
        # Replace 60/minute
        old_60 = 'dependencies=[Depends(PreAuthRateLimit("60/minute"))]'
        new_60 = f'dependencies=[Depends(PreAuthRateLimit("60/minute")), Depends({auth_dependency})]'
        content = content.replace(old_60, new_60)

        # Replace 30/minute
        old_30 = 'dependencies=[Depends(PreAuthRateLimit("30/minute"))]'
        new_30 = f'dependencies=[Depends(PreAuthRateLimit("30/minute")), Depends({auth_dependency})]'
        content = content.replace(old_30, new_30)

        # Replace 15/minute
        old_15 = 'dependencies=[Depends(PreAuthRateLimit("15/minute"))]'
        new_15 = f'dependencies=[Depends(PreAuthRateLimit("15/minute")), Depends({auth_dependency})]'
        content = content.replace(old_15, new_15)

        # Replace 2/minute
        old_2 = 'dependencies=[Depends(PreAuthRateLimit("2/minute"))]'
        new_2 = f'dependencies=[Depends(PreAuthRateLimit("2/minute")), Depends({auth_dependency})]'
        content = content.replace(old_2, new_2)

        with open(filepath, 'w') as f:
            f.write(content)
        print(f"Fixed {filepath}")

files = glob.glob("backend/app/api/v1/*.py")
for file in files:
    if "admin_coupons" in file:
        fix_file(file, "require_owner")
    elif "admin_" in file:
        fix_file(file, "require_admin")

