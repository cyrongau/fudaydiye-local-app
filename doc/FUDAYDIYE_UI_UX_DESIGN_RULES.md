Fudaydiye UI/UX Design Rules & AI Design System
Purpose of This Document

This file defines strict, reusable UI/UX rules for all AI-generated and human-designed interfaces across the Fudaydiye platform. It is intended to be referenced continuously by AI agents and designers to ensure consistency, scalability, brand alignment, and usability across all apps.

This design system applies to:

Customer App (E-commerce + Live Sale)

Vendor App / Vendor Dashboard

Delivery App (Logistics & Tracking)

Admin & Super Admin Dashboards

Web & Mobile (Flutter-first)

Brand Identity & Visual Direction
Brand Personality

Simple

Trustworthy

Modern

Local-first but globally competitive

Fast, friendly, and human

Core Design Philosophy

"Make commerce feel easy, human, and live."

Every screen should:

Reduce cognitive load

Feel lightweight and responsive

Encourage action without pressure

Color System (Derived from Fudaydiye Logo)
Primary Brand Color

Fudaydiye Green – Primary action color #14dd84

Used for: CTAs, highlights, active states, progress indicators

Secondary Colors

Soft Dark Green / Teal tones – headers, icons #005653

Light Neutral Gray – backgrounds

Off-White – cards & containers

Accent Colors

Amber / Orange – promotions, discounts, live indicators

Red – errors only

Blue – links and informational states

⚠️ Rules:

Never use more than 2 accent colors per screen

Backgrounds must remain neutral

Typography Rules
Font Style

Sans-serif, modern, rounded edges

Highly readable on low-end devices

Font Hierarchy

H1: Page titles only

H2: Section headers

Body: Product descriptions, text

Caption: Metadata, timestamps

⚠️ Rules:

Never use more than 3 font sizes per screen

Avoid ALL CAPS except for labels or badges

Layout & Spacing System
Layout Principles

Card-based layout

Rounded corners (medium radius)

Floating action buttons only when essential

Spacing Rules

8px spacing system (8 / 16 / 24 / 32)

Minimum touch target: 44px

Grid

Mobile: 4-column fluid grid

Tablet/Web: 8–12 columns

Component Design Rules
Buttons

Primary: Filled (Brand Green)

Secondary: Outline

Tertiary: Text only

Rules:

One primary CTA per screen

Button text must be verb-first ("Buy Now", "Go Live")

Cards

Used for products, orders, vendors, live sessions

Always include:

Title

Key action

Visual hierarchy

Navigation Rules
Bottom Navigation (Mobile)

Max 5 items

Icons + labels

Recommended Tabs:

Home

Live Sale

Orders

Wallet

Profile

Gesture Use

Swipe for secondary actions only

Never hide core actions behind gestures

Live Sale UI Rules (Social E-commerce)
Live Session Screen

Video occupies 60–70% of screen

Product cards slide in from bottom

Floating "Buy" button always visible

Live Indicators

Red/Amber "LIVE" badge

Viewer count visible

Subtle animations only

Interaction

Real-time chat panel

Emoji reactions allowed

Pin product feature

Logistics & Tracking UI (Inspired by Reference Image)
Map Screen Rules

Clean, uncluttered map

Route highlighted

Driver avatar visible

Tracking Info Card

Floating bottom card

Minimal text

Real-time updates

Forms & Checkout UX Rules
Checkout Principles

Max 3 steps

Progress indicator mandatory

Inline validation only

Payment UI

Clear mobile money logos

Default to last-used method

Accessibility Rules

Contrast ratio AA minimum

Text scaling support

Clear icon labels

AI Design Iteration Rules

When AI generates designs:

Generate 3 distinct layout variations per screen

Explain design reasoning briefly

Highlight differences between versions

Follow brand colors strictly

Never invent new colors

Design Review Checklist (AI Must Validate)

Before submitting any UI:




Final Rule

If a design choice is unclear, prioritize: Clarity > Speed > Beauty

This document is the single source of truth for all UI/UX decisions across the Fudaydiye platform.