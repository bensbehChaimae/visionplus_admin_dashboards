# Vision+ Clinic – Admin Dashboard :

![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![n8n](https://img.shields.io/badge/n8n-AE4EF5?style=for-the-badge&logo=n8n&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)
![OpenAI](https://img.shields.io/badge/OpenAI-412991?style=for-the-badge&logo=openai&logoColor=white)
![Google Calendar API](https://img.shields.io/badge/Google%20Calendar%20API-4285F4?style=for-the-badge&logo=googlecalendar&logoColor=white)

## Overview 

This project is the second phase of the **Vision+ Clinic AI Medical Receptionist System**.  


[![GitHub Repo](https://img.shields.io/badge/View_on-GitHub-black?logo=github)](https://github.com/bensbehChaimae/visionplus_receptionist_agent)

It introduces an **Admin Dashboard** designed to complement the AI receptionist by providing tools for clinic staff to manage and verify chatbot-generated data.

**Key Points:**
- Extends the first project where an AI agent handled patient registration and appointment booking.  
- Allows administrators to review, confirm, and manage patient and appointment records.  
- Ensures data accuracy and human oversight over AI-generated inputs.  
- Uses **Supabase** as the backend service for authentication, storage, and real-time data management.


## System Architecture

- Frontend: React
- Backend: Supabase (used as **Backend-as-a-Service**)
   - Migrations: Managed through Supabase migrations
   - Authentication: Supabase Auth

No custom backend is used all data operations and authentication are handled by Supabase.



## Main Features :

- Secure admin sign-in page

![signin](/src/assets/signin.png)

- Home page overview

![homepage](/src/assets/homepage.png)


- Patient dashboard (view and confirm patient data)

![patient](/src/assets/patient.png)

- Appointment dashboard (review and approve appointments)

![appointments](/src/assets/appointments.png)











