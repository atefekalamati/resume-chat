---
slug: bambo-finance
title_fa: ماژول مالی BAMBO — هزینه و گزارش مالی پروژه‌های ساختمانی
title_en: BAMBO Finance — Cost Control & Financial Reporting Module for Construction Projects
category: Backend Engineering / Product
featured: true
role: توسعه‌دهندهٔ Backend (Python/FastAPI) در تیم BAMBO؛ ماژول در قالب تیم دونفره (Backend + Frontend) و به روش AI-first، قراردادمحور و تست‌محور ساخته شد
github: https://github.com/atefekalamati/FinanceBambo
status: integration candidate (validated locally; host production acceptance pending)
tech: [Python 3.12, FastAPI, Pydantic, PostgreSQL 16, psycopg, Alembic, pytest, MPXJ, PaddleOCR, Whisper, Vanilla JavaScript (ES Modules), node:test, GitHub Actions]
skills: [API Design, OpenAPI, Domain Modeling, Database Design, Migrations, Concurrency, Financial Integrity, Permissions & Scoping, AI Integration with Human-in-the-loop, Testing, CI/CD, Technical Documentation]
tags: [construction, fintech, cost-control, fastapi, postgresql, ocr, speech-to-text, ms-project, featured]
---

# ماژول مالی BAMBO

## خلاصه
**فارسی:** BAMBO پلتفرم پایش پروژه‌های ساختمانی است. این ماژول برای مالک پروژه، در یک نما نشان می‌دهد:
- برآورد اولیه چقدر بود.
- تا امروز واقعاً چقدر خرج شده.
- کار انجام‌شده با قیمت امروز چقدر می‌ارزد.
- تا پایان پروژه چقدر پول لازم است.

فاکتورها را می‌شود دستی، با **عکس** (OCR) یا با **پیام صوتی فارسی** (Whisper) ثبت کرد. هوش مصنوعی فقط پیش‌نویس می‌سازد و هیچ عددی بدون تأیید انسان وارد گزارش مالی نمی‌شود.

**English:** A finance module for a construction-project monitoring platform. A FastAPI + PostgreSQL backend exposes 51 endpoints and covers:
- estimates and revisions
- append-only price history
- multi-line invoices
- progress snapshots from MS Project (MPXJ)
- immutable report snapshots
- invoice capture from photos (PaddleOCR) and Persian voice notes (Whisper), with mandatory human confirmation

It is validated by 1,361 backend and 546 frontend tests, 21 database financial invariants, and CI on every push.

## مسئله
- مالک برآورد، هزینهٔ واقعی، ارزش روز کار و پول لازم تا پایان را در یک نما نمی‌دید.
- قیمت مصالح، دستمزد و دستگاه مدام تغییر می‌کند؛ برآورد اولیه برای تصمیم امروز کافی نیست.
- فاکتورها پراکنده‌اند و ورود دستی‌شان کند است.
- خیلی از پروژه‌ها انبار دقیق ندارند، پس محصول نباید به انبار وابسته باشد.

## راه‌حل
| بخش | چه می‌کند |
|---|---|
| اقلام مالی و برآورد | چهار نوع قلم (مصالح، نیروی انسانی، دستگاه، هزینهٔ عمومی)؛ خط برآورد برای هر فعالیت؛ مقدار اولیه هرگز بازنویسی نمی‌شود و اصلاح‌ها با تاریخچه ثبت می‌شوند |
| قیمت روز | قیمت پایهٔ سازمان و قیمت اختصاصی پروژه؛ تاریخچهٔ قیمت **فقط افزودنی** است (append-only)؛ ورود دستی، Excel و Google Sheet؛ تبدیل واحد |
| پیشرفت پروژه | خواندن فایل Microsoft Project (MPP) با MPXJ و دریافت Snapshot فقط‌خواندنی پیشرفت |
| فاکتور | فاکتور چندردیفی؛ فاکتور تأییدشده قابل ویرایش یا حذف نیست و فقط با سند اصلاحی یا ابطال تغییر می‌کند؛ شماره‌گذاری پیوسته و بدون شکاف |
| ورود با AI | عکس فاکتور با PaddleOCR و صدای فارسی با Whisper؛ هر دو روی سرور خودمان اجرا می‌شوند؛ خروجی فقط پیش‌نویس است و اثر مالی‌اش تا تأیید صفر می‌ماند |
| گزارش | داشبورد مدیریتی، گزارش‌ساز، نسخهٔ چاپی و PDF، خروجی CSV/XLSX؛ گزارش دوره‌ای به‌صورت Snapshot تغییرناپذیر |
| دسترسی | هر کاربر فقط دادهٔ سازمان و پروژهٔ خودش را می‌بیند؛ مجوز جداگانه برای مدیریت فاکتور |

## معماری
- **Backend:**
  - Python 3.12 و FastAPI.
  - لایه‌های جدا: domain، services، schemas با Pydantic، repositories با SQL پارامتری روی psycopg (بدون ORM).
  - همهٔ مسیرها زیر `/api/projects/{projectId}/finance` هستند؛ قرارداد OpenAPI با کد همگام است.
- **پایگاه داده:**
  - PostgreSQL 16.
  - Alembic تنها مرجع تغییرات Schema است.
  - پول به‌صورت عدد صحیح ریال ذخیره می‌شود.
- **اتصال به میزبان:**
  - احراز هویت، دسترسی، ذخیرهٔ فایل، پیشرفت و استخراج AI پشت آداپتر هستند.
  - ماژول مستقل ساخته شد و با قرارداد (Integration Kit) به BAMBO وصل می‌شود.
- **Frontend:** JavaScript خالص با ES Modules؛ بدون فریم‌ورک، بدون وابستگی و بدون Build؛ تقویم شمسی؛ نمایش تومان.
- **CI:** GitHub Actions روی هر Push و Pull Request؛ تست‌های backend، تست‌های frontend و بررسی چیدمان صفحه در مرورگر واقعی.

## چالش‌های فنی و راه‌حل
- **شماره‌گذاری فاکتور زیر بار هم‌زمان:**
  - شش درخواست هم‌زمان شش شمارهٔ متمایز گرفتند.
  - اگر تراکنشی شکست بخورد، شماره‌اش آزاد می‌شود و شکافی نمی‌ماند.
- **تغییرناپذیری داده‌های مالی:** فاکتور صادرشده با Trigger دیتابیس قفل است و تغییر قیمت روز هیچ گزارش قبلی را عوض نمی‌کند.
- **مهاجرت امن روی دادهٔ واقعی:**
  - مهاجرت با ۳۰ آزمون پذیرش بررسی شد، روی ۵۳ فاکتور موجود.
  - شماره‌های صادرشده بایت‌به‌بایت حفظ شد.
  - اجرای دوباره هیچ تغییری نداد، downgrade امن بود، و شکست وسط کار بدون گام بازیابی برگشت خورد.
- **AI قابل‌اعتماد:**
  - برای تصویر و صدا دو رابط جداگانه وجود دارد و نام سرویس‌دهنده در منطق مالی نیامده.
  - فایل با سه بررسی کنترل می‌شود: پسوند، نوع فایل و Magic Bytes.
  - اگر استخراج در دسترس نباشد، سیستم صریحاً همین را می‌گوید و حدس نمی‌زند.

## نتایج پذیرش
| بررسی | نتیجه |
|---|---|
| تست‌های backend | ۱٬۳۶۱ موفق، ۰ ناموفق |
| تست‌های frontend | ۵۴۶ موفق، ۰ ناموفق |
| مسیرهای API | ۵۱، همگام با OpenAPI |
| ناوردهای مالی دیتابیس | ۲۱ از ۲۱ |
| جریان کامل فاکتور روی API زنده | ۱۳ از ۱۳ |
| پشتیبان‌گیری و بازگردانی | ۱۵ از ۱۵ مقایسه یکسان |
| بررسی چیدمان در مرورگر | ۵۴ اجرا، ۰ خطا |

## محدودیت‌ها و کارهای باز
- پذیرش در محیط تولید میزبان هنوز انجام نشده؛ نتایج بالا روی کپی ایزوله اندازه‌گیری شده‌اند.
- ثبت مجوز مدیریت فاکتور در هستهٔ BAMBO کار تیم میزبان است.
- دو گزارش چاپی بزرگ از سقف تعداد صفحه بیشترند.
- انبار، پرداخت، حسابداری دوبل و قیمت آنلاین خودکار عمداً خارج از نسخهٔ اول (MVP) هستند.

## مهارت‌هایی که نشان می‌دهد
طراحی API و مدل دامنهٔ مالی، PostgreSQL و مهاجرت امن با Alembic، مدیریت هم‌زمانی و یکپارچگی داده، امنیت و کنترل دسترسی، به‌کارگیری OCR و تبدیل گفتار به متن با تأیید انسانی، کار با فایل‌های MS Project، تست گسترده و CI، و مستندسازی تحویل (Runbookهای نصب، ارتقا، بازگشت و پشتیبان‌گیری).

## سؤال‌های متداول (برای چت‌بات)
**این پروژه چه مشکلی را حل می‌کند؟**
به مالک پروژهٔ ساختمانی در یک نما نشان می‌دهد برآورد چقدر بود، چقدر خرج شده، کار انجام‌شده امروز چقدر می‌ارزد و تا پایان چقدر پول لازم است.

**نقش عاطفه در این پروژه چه بود؟**
توسعه‌دهندهٔ Backend با Python و FastAPI در تیم BAMBO.

**هوش مصنوعی کجای کار است؟**
فقط در ورود فاکتور: از عکس (PaddleOCR) یا صدای فارسی (Whisper) پیش‌نویس می‌سازد. تا کاربر تأیید نکند، اثر مالی صفر است.

**چرا فاکتور تأییدشده قابل ویرایش نیست؟**
برای اعتبار حسابرسی. هر تغییری فقط با سند اصلاحی یا ابطال ثبت می‌شود و تاریخچه حفظ می‌ماند.

**کیفیت چطور تضمین شد؟**
۱٬۳۶۱ تست backend، ۵۴۶ تست frontend، ۲۱ ناوردای مالی در دیتابیس، آزمون پشتیبان و بازگردانی، و CI روی هر Push.

**از چه فناوری‌هایی استفاده شد؟**
FastAPI، PostgreSQL، Alembic، psycopg، Pydantic، MPXJ، PaddleOCR، Whisper، JavaScript خالص و GitHub Actions.
