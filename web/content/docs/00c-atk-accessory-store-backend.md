---
slug: atk-accessory-store-backend
title_fa: بک‌اند فروشگاه آنلاین اکسسوری ATK (Project AK)
title_en: ATK Online Accessory Store — E-commerce Backend API (FastAPI, async)
category: Backend Engineering / E-commerce
featured: true
role: مالک محصول و تنها توسعه‌دهنده (PRD، معماری، پیاده‌سازی، تست، CI/CD)
github: https://github.com/atefekalamati/accessorProject
status: MVP backend complete (phases 1–3 of 6); account/admin and release phases next
tech: [Python 3.12, FastAPI, Pydantic v2, SQLAlchemy 2 (async), asyncpg, PostgreSQL 16, Alembic, PyJWT, pytest, pytest-asyncio, pytest-xdist, ruff, mypy (strict), Docker Compose, GitHub Actions, GHCR, gitleaks]
skills: [E-commerce Domain Design, Modular Monolith, Async Python, Inventory Reservation & Concurrency, Payment Flow & Reconciliation, Idempotency, State Machines, OTP + JWT Auth, RBAC, Audit Logging, CI/CD, Secret Scanning, ADRs, Project Planning]
tags: [e-commerce, fastapi, async, postgresql, payments, inventory, concurrency, ci-cd, featured]
---

# بک‌اند فروشگاه آنلاین اکسسوری ATK

## خلاصه
**فارسی:** API کامل یک فروشگاه آنلاین اکسسوری که مستقیم به مشتری می‌فروشد. چرخهٔ خرید کامل است:
- کاتالوگ با تنوع رنگ، سایز و مدل.
- سبد خرید مهمان و کاربر.
- ورود با موبایل و OTP.
- قیمت‌گذاری و کد تخفیف.
- رزرو موجودی، ثبت سفارش و پرداخت آنلاین.

همهٔ کار را خودم انجام دادم: سند نیازمندی‌ها، معماری، کد، تست و CI/CD.

**English:** A solo-built, production-minded e-commerce backend: catalog with variants, guest and user carts, OTP + JWT auth, server-side pricing and discounts, inventory reservations with no-oversell guarantees, idempotent checkout, an order state machine, and payment init/callback/reconciliation. It has 66 endpoints and about 927 tests, and runs under strict mypy, ruff, gitleaks secret scanning, locked dependencies, and CI with an ephemeral staging smoke test and a GHCR image per phase.

## مسئله
- فروش مستقیم اکسسوری بدون واسطه، با قیمت کمتر و خرید راحت‌تر.
- قواعد سخت کسب‌وکار:
  - قیمت نهایی فقط در سرور محاسبه شود.
  - موجودی قبل از پرداخت بررسی شود و هیچ‌وقت منفی نشود.
  - اگر قیمت یا موجودی تغییر کرد، کاربر قبل از پرداخت مطلع شود.
  - اگر پرداخت خطا داد، سفارش نهایی نشود و امکان تلاش دوباره باشد.
  - عملیات حساس مدیریتی قابل پیگیری باشد.

## قابلیت‌ها
| ماژول | چه می‌کند |
|---|---|
| ورود و دسترسی | OTP پیامکی، Access/Refresh Token با چرخش (Rotation)، خروج، نقش‌ها و مجوزها، مدیریت کاربران |
| کاتالوگ | دسته‌بندی، محصول، تنوع (رنگ، سایز، مدل)، ویژگی‌ها، تصویر، فهرست و فیلتر عمومی، مرتب‌سازی پرفروش‌ترین |
| قیمت‌گذاری | قیمت هر تنوع، تابع قیمت سمت سرور، تاریخچهٔ قیمت، تنظیمات قیمت |
| موجودی | انبار، جابه‌جایی و اصلاح موجودی، **رزرو** موقت، تأیید یا آزادسازی رزرو، Job انقضای رزرو |
| سبد خرید | سبد مهمان با توکن، ادغام سبد مهمان با سبد کاربر بعد از ورود، قیمت همیشه از سرور |
| تخفیف | قواعد تخفیف، اعمال کد روی سبد، سقف استفاده، ثبت هر استفاده |
| آدرس و ارسال | مدیریت آدرس، روش‌های ارسال و محاسبهٔ هزینهٔ ارسال |
| سفارش | Checkout با **Idempotency-Key**، State Machine سفارش، لغو توسط مشتری، لغو خودکار با انقضای رزرو |
| پرداخت | شروع پرداخت، Callback با تأیید سمت سرور، Job تطبیق پرداخت‌های معلق (Callback گم‌شده، رهاشده)، حالت «نیازمند بازپرداخت» برای مغایرت |

## معماری
- **Modular Monolith:**
  - یک برنامهٔ FastAPI با ماژول‌های جدا زیر `app/modules/`.
  - همهٔ APIها زیر `/api/v1` هستند.
  - هر ماژول لایه‌های router، service، repository و schemas دارد.
- **Async کامل:** SQLAlchemy 2 async و asyncpg روی PostgreSQL 16، با Alembic (۲۵ مهاجرت).
- **قرارداد خطای ثابت:** هر پاسخ `request_id` دارد، لاگ‌ها JSON هستند و اطلاعات حساس در لاگ پوشانده می‌شود.
- **درگاه پرداخت پشت Interface:** درگاه آزمایشی (fake) برای تست و staging داریم؛ درگاه واقعی بعداً وصل می‌شود.

## چالش‌های فنی و راه‌حل
- **جلوگیری از فروش بیش از موجودی (Oversell):**
  - ۲۰ خریدار هم‌زمان روی موجودی ۷ تست شد.
  - ۱۸ سبد چندکالایی با ترتیب قفل متقاطع تست شد.
  - اصلاح هم‌زمان موجودی توسط ادمین تست شد.
  - در همهٔ حالت‌ها موجودی منفی نشد.
- **ثبت سفارش تکراری:** Idempotency-Key تضمین می‌کند دوبار زدن دکمه دو سفارش نسازد.
- **پرداخت قابل‌اعتماد:**
  - نتیجهٔ پرداخت در یک تراکنش اعمال می‌شود.
  - پرداخت دیرهنگام یا دوم به وضعیت «نیازمند بازپرداخت» می‌رود.
  - Job تطبیق با Advisory Lock پرداخت‌های معلق را جمع می‌کند.
  - تست‌های سوءاستفاده و رقابتی یک باگ زمان‌بندی رزرو را پیدا کردند که رفع شد.
- **امنیت زنجیرهٔ تأمین:**
  - وابستگی‌ها قفل‌شده و با هش نصب می‌شوند.
  - gitleaks کل تاریخچهٔ git را اسکن می‌کند.
  - در Production، CORS با `*` و OTP آزمایشی رد می‌شود.

## کیفیت و DevOps
| مورد | وضعیت |
|---|---|
| تست‌ها | حدود ۹۲۷ تابع تست در ۷۷ فایل (واحد و یکپارچگی روی PostgreSQL یک‌بارمصرف)، اجرای موازی با xdist |
| بررسی کیفیت | ruff (lint و format) و mypy در حالت strict |
| CI | lint، type-check، تست، **شکست در صورت تست Skip‌شده**، بررسی تغییر lock و اسکن secret |
| Staging | در CI روی دیتابیس خالی بالا می‌آید و Smoke Test اجرا می‌شود: سلامت، ورود OTP، خواندن کاتالوگ، نوشتن ادمین، خرید کامل |
| تحویل | Image Docker برای هر فاز در GHCR، همراه با git tag |
| مستندات | ۵۲ سند تصمیم معماری (ADR)، OpenAPI، راهنمای Frontend، برنامه و پیشرفت پروژه |

## برنامه‌ریزی و وضعیت
- پروژه به ۶ فاز و ۱۴۸ تسک تقسیم شده و هر تسک یک فایل با معیار پذیرش دارد.
- فاز ۱ (زیرساخت)، فاز ۲ (دامنهٔ اصلی) و فاز ۳ (چرخهٔ خرید) کامل شده‌اند.
- **MVP صددرصد** است و حدود ۶۶٪ کل پروژه انجام شده.
- بعدی: حساب کاربری و پنل مدیریت، سپس انتشار. انتخاب درگاه پرداخت و پیامک واقعی هنوز باز است.

## مهارت‌هایی که نشان می‌دهد
طراحی دامنهٔ فروشگاه، Python async، مدیریت هم‌زمانی و قفل در PostgreSQL، طراحی جریان پرداخت امن، Idempotency، State Machine، احراز هویت OTP و JWT، CI/CD کامل، امنیت زنجیرهٔ تأمین، مستندسازی تصمیم‌ها، و برنامه‌ریزی و مدیریت پروژهٔ شخصی بلندمدت.

## سؤال‌های متداول (برای چت‌بات)
**این پروژه چیست؟**
بک‌اند یک فروشگاه آنلاین اکسسوری با کاتالوگ، سبد خرید، تخفیف، موجودی، سفارش و پرداخت آنلاین.

**نقش عاطفه چه بود؟**
تنها توسعه‌دهنده و مالک محصول؛ از نوشتن PRD تا معماری، کد، تست و CI/CD.

**چطور جلوی فروش بیش از موجودی گرفته شد؟**
با رزرو موجودی و قفل‌گذاری در PostgreSQL. ۲۰ خریدار هم‌زمان روی موجودی ۷ تست شد و موجودی هیچ‌وقت منفی نشد.

**Idempotency-Key چیست؟**
یک کلید یکتا برای هر درخواست ثبت سفارش؛ اگر همان درخواست دوباره برسد، سفارش دوم ساخته نمی‌شود.

**اگر پرداخت ناموفق باشد چه می‌شود؟**
سفارش نهایی نمی‌شود و کاربر می‌تواند دوباره پرداخت کند. پرداخت‌های معلق را یک Job تطبیق می‌دهد.

**کیفیت کد چطور کنترل می‌شود؟**
حدود ۹۲۷ تست، mypy در حالت strict، ruff، اسکن secret، و Smoke Test روی staging در هر CI.
