# gps-parking-spot
COMP231 Software Development Project – GPS-based parking spot management system.
<<<<<<< HEAD
=======

## Admin login (no CLI command needed)

You can login as admin directly from the app login page.

1. Add these values to backend `.env`:

```
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=yourStrongPassword
ADMIN_NAME=System Admin
```

2. Start backend normally (`npm start` in `backend`).
3. The server will auto-create the admin user if it does not exist, or promote that email to `admin` role if it already exists.
4. Login in the app using the same admin email/password.

Role values in MongoDB `Users` collection:
- `user` = regular user
- `admin` = admin user

## Admin signup using app

To allow creating admin accounts from the signup page, set this in backend `.env`:

```
ADMIN_SIGNUP_CODE=your-secret-admin-code
```

On the app signup page, check "Sign up as Admin" and enter the same code.
>>>>>>> 1bf0725 (Resolve merge conflicts)
