# Add a user so GET /user returns data

Your app is connected to **localhost:27017/social-media**. That database's `users` collection is empty, so GET /user returns `[]`.

## Add a user via Postman

1. **Method:** `POST`
2. **URL:** `http://localhost:8000/user`
3. **Headers:** `Content-Type: application/json`
4. **Body (raw, JSON):**
   ```json
   {
     "name": "Aryan Pareek",
     "email": "pareekaryan477@gmail.com",
     "image": "https://img.clerk.com/example.png"
   }
   ```

5. Click **Send**. You should get back the created user (201).
6. Then call **GET** `http://localhost:8000/user` — you should see 1 user (or more if you add more).

After that, GET /user and GET /user?email=... will work. The only issue was that this database had no users yet.
