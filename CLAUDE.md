# CLAUDE.md

# Project Name

FrenchMaster - AI Powered French Learning Platform

---

# Mission

Build the highest quality French learning platform available.

This is NOT an AI demo.

This should look like it was designed and engineered by an experienced team from Duolingo, Babbel, Memrise, Notion and Stripe.

Every feature should feel polished.

Everything should be production ready.

Never generate placeholder code unless explicitly requested.

Always think about scalability.

---

# Current Content Scope (read this before adding any course)

**We only teach French. Full stop.** No other language is offered to
learners today, and none should be added, seeded, published, or exposed in
any user-facing picker/nav without an explicit, separate go-ahead.

This does NOT mean ripping out language-agnostic architecture — the
Universal Lesson Engine (`src/lesson-engine/`) is deliberately built so a
future language requires zero engine code changes, and that design should
be preserved. It means: do not publish, seed, or surface non-French course
content to real users. Demo/sample content in other languages (used only to
prove the engine's architecture) must stay unpublished/hidden from any
learner-facing surface, not just excluded from a specific list.

---

# Core Goal

Allow users to learn French from absolute beginner (A1) all the way to upper intermediate (B2).

The platform should include:

- Structured learning
- Interactive lessons
- Native pronunciation
- Listening practice
- Speaking practice
- Vocabulary
- Grammar
- Exercises
- Quizzes
- Exams
- Progress tracking
- Gamification
- Analytics
- Admin management

---

# Tech Stack

Frontend

- Next.js
- TypeScript
- React
- Tailwind CSS
- Shadcn UI
- Framer Motion

Backend

- Node.js
- Express
- PostgreSQL
- Prisma
- Redis
- BullMQ

Authentication

- Google Login
- Apple Login
- Email Login
- JWT
- Refresh Token

Storage

- Supabase Storage
or
- Cloudflare R2

Deployment

- Docker
- GitHub Actions
- Vercel
- Railway
or
AWS

---

# AI

Use AI only where necessary.

AI should enhance learning.

Never replace structured education.

Use AI for:

- pronunciation feedback
- explanations
- personalized review
- adaptive learning
- mistake analysis

---

# Speech Engine

Use the highest quality available.

Priority

1. ElevenLabs
2. Google Cloud Text To Speech

Must support:

Natural voices

French native accent

Male and Female

Slow Mode

Normal

Fast

Users can replay unlimited times.

---

# Speech Recognition

Use

Google Speech API

or

Whisper

or

Deepgram

Requirements

Detect pronunciation

Detect missing words

Detect incorrect pronunciation

Give feedback

Highlight mistakes

Score pronunciation

Store history

---

# Language Levels

Support

A1

A2

B1

B2

Every level contains

Units

Lessons

Sub Lessons

Exercises

Quiz

Review

Exam

Certificate

---

# Course Structure

Example

French

A1

Unit 1

Greetings

Lesson

Bonjour

Bonsoir

Salut

Formal

Informal

Vocabulary

Examples

Audio

Pronunciation

Exercise

Quiz

Review

Unit Complete

Continue

Every unit follows the same structure.

---

# Lesson Structure

Each lesson contains

Introduction

Vocabulary

Pronunciation

Grammar

Conversation

Examples

Listening

Speaking

Reading

Writing

Practice

Review

Quiz

Completion

---

# Learning Methods

Every lesson should include

Text

Image

Illustration

Native Audio

Pronunciation Practice

Conversation

Translation

Real Life Examples

Mini Challenge

Review

---

# Pronunciation Practice

Every important sentence

Play Audio

↓

User repeats

↓

Speech Recognition

↓

AI Feedback

↓

Pronunciation Score

↓

Retry

↓

Continue

Store

Attempts

Best score

Latest score

History

---

# Listening Practice

User listens

Questions appear

Choose correct answer

Fill missing words

True False

Multiple Choice

Reorder sentence

---

# Reading Practice

Paragraph

Questions

Vocabulary Highlight

Translation Toggle

Audio Support

---

# Grammar

Grammar explanation

Examples

Exercises

Mistake correction

Review

---

# Vocabulary

Word

Meaning

Gender

Pronunciation

Example

Image

Synonyms

Common mistakes

Favorite

Review Later

---

# Conversation Practice

Real life conversations

Restaurant

Airport

Hotel

Shopping

Hospital

Office

Travel

Friends

Dating

Business

School

Every conversation

Audio

Translation

Pronunciation

Role Play

---

# Quiz

Each sub lesson ends with quiz.

Question Types

Multiple Choice

Audio Question

Image Question

Listening

Speaking

Typing

Fill Blank

Arrange Sentence

Match

True False

User receives

XP

Coins

Accuracy

Completion

---

# Wrong Answer Tracking

Track

Every incorrect answer

Mistake frequency

Lesson

Topic

Difficulty

Date

Retry count

User can

Retry immediately

Retry later

Skip

Review at end

Review tomorrow

Smart Review

Use spaced repetition.

---

# Progress Tracking

Track

Current level

Lesson completion

Time spent

Vocabulary learned

Pronunciation score

Grammar score

Listening score

Reading score

Speaking score

Overall Fluency

Dashboard

Daily streak

Weekly streak

Monthly streak

---

# Adaptive Learning

If user struggles

Automatically

Recommend easier lesson

Recommend review

Recommend pronunciation

Recommend grammar

Recommend listening

---

# Exam Mode

Users may choose

A1 Exam

A2 Exam

B1 Exam

B2 Exam

Complete Exam

Exam should simulate DELF style.

Sections

Listening

Speaking

Reading

Writing

Grammar

Vocabulary

Pronunciation

Timer

Randomized Questions

No hints

Score

Certificate

Review mistakes

Retake

---

# Certificate

Generate certificate

Include

Name

Level

Date

Score

Unique Verification ID

Download PDF

---

# Gamification

XP

Coins

Achievements

Daily Goal

Weekly Goal

Leaderboards

Badges

Perfect Pronunciation

7 Day Streak

30 Day Streak

Master Speaker

Grammar Expert

Vocabulary Master

---

# Sidebar Navigation

Use left sidebar.

Never use a crowded top navigation.

Sidebar

Dashboard

Learn

Vocabulary

Grammar

Listening

Speaking

Reading

Writing

Practice

Exam

Achievements

Certificates

Progress

Settings

Profile

---

# UI Design

Must never look AI generated.

Reference

Notion

Duolingo

Linear

Stripe Dashboard

Apple Human Interface

Material Design

---

# Color Palette

60%

#FFFFFF

#F5F7FA

30%

#0B1F3A

#1F3B64

10%

#FF7A59

Hover

#FF8C6E

Success

#22C55E

Warning

#F59E0B

Danger

#EF4444

---

# Typography

Inter

or

SF Pro Display

Large spacing

Rounded corners

Smooth animations

Minimal shadows

No clutter

---

# Animations

Framer Motion

Smooth transitions

Page transitions

Button animations

Progress animation

Completion celebration

---

# User Dashboard

Welcome

Current Level

Continue Learning

Daily Goal

Today's Lesson

Pronunciation Score

Study Time

XP

Achievements

Weak Topics

Upcoming Exam

---

# Notifications

Daily Reminder

Weekly Goal

Lesson Completed

Exam Ready

Achievement Unlocked

---

# Admin Panel

Production grade.

Sidebar

Dashboard

Users

Roles

Permissions

Courses

Lessons

Units

Vocabulary

Grammar

Audio

Pronunciation

Quizzes

Exams

Certificates

Analytics

Payments

Subscriptions

Reports

Support

CMS

Announcements

Settings

Logs

API Keys

Feature Flags

Backups

---

# Admin Features

Manage users

Suspend users

Ban users

Reset password

Assign role

Edit profile

View learning history

View pronunciation history

View exams

Export users

Import users

Manage lessons

Upload audio

Upload video

Edit content

Schedule content

Version control

Preview lesson

Publish

Unpublish

Duplicate lesson

Analytics

Daily active users

Retention

Completion rate

Drop off

Exam pass rate

Revenue

Subscriptions

Logs

System health

Error tracking

Audit logs

---

# Environment Variables

Create .env.example

Include

DATABASE_URL

JWT_SECRET

JWT_REFRESH_SECRET

GOOGLE_CLIENT_ID

GOOGLE_CLIENT_SECRET

SUPABASE_URL

SUPABASE_ANON_KEY

SUPABASE_SERVICE_ROLE

REDIS_URL

ELEVENLABS_API_KEY

GOOGLE_TTS_API_KEY

OPENAI_API_KEY

ANTHROPIC_API_KEY

STRIPE_SECRET

STRIPE_WEBHOOK_SECRET

SMTP_HOST

SMTP_PORT

SMTP_USER

SMTP_PASSWORD

NEXT_PUBLIC_API_URL

NEXT_PUBLIC_APP_URL

---

# Documentation

Create complete documentation.

Include

Installation

Requirements

Folder Structure

Architecture

Database Schema

API Documentation

Authentication

Deployment

Docker

GitHub Actions

Environment Variables

Backup

Restore

Production Checklist

Monitoring

Scaling

Admin Guide

Developer Guide

Contribution Guide

Testing Guide

Security Guide

---

# Testing

Write

Unit Tests

Integration Tests

E2E Tests

Accessibility Tests

Performance Tests

Load Tests

---

# Code Quality

Use

TypeScript everywhere

Reusable components

Clean Architecture

SOLID Principles

Feature based folders

No duplicated code

Production ready

---

# Final Goal

Build the best French learning platform available.

Every screen should feel premium.

Every interaction should feel smooth.

Every feature should scale to millions of users.

Always optimize for learning outcomes, user engagement, accessibility, maintainability, security, and long-term scalability.

Never sacrifice quality for speed.