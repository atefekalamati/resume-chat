---
slug: bambo-pilot-platform
title_fa: سامانهٔ مدیریت فرایند پایلوت BAMBO — گردش‌کار ۱۹ مرحله‌ای با چک‌لیست و تأیید
title_en: BAMBO Pilot Platform — 19-Stage Workflow, Checklists, Approvals & RBAC
category: Backend Engineering / Workflow System
featured: true
role: توسعه‌دهندهٔ Backend (Python/FastAPI) در تیم BAMBO؛ طبق PRD، Backend و Frontend دو نقش جدا بودند
github: https://github.com/atefekalamati/bamboPlatform
status: PRD workflow complete (stages 1–19, gates G1–G5); production load test pending
tech: [Python, FastAPI, SQLAlchemy 2, Pydantic 2, PostgreSQL, psycopg, Alembic, pytest, WeasyPrint, persiantools, Docker Compose, GitHub Actions, Vanilla JavaScript]
skills: [Workflow / State Machine Design, RBAC, OTP Authentication, Secure File Upload, Immutable Snapshots, Audit Trail, SLA Tracking, Notifications, KPI Reporting, Migrations, Testing, CI, Deployment Runbooks]
tags: [construction, workflow, state-machine, rbac, otp, fastapi, postgresql, docker, featured]
---

# سامانهٔ مدیریت فرایند پایلوت BAMBO

## خلاصه
**فارسی:** BAMBO پلتفرم پایش پروژه‌های ساختمانی است. قبل از قرارداد، هر مشتری یک دورهٔ **پایلوت** را طی می‌کند: ثبت پروژه، دریافت نقشه، برداشت میدانی، آموزش مالک، ارزیابی و پیشنهاد تجاری. این سامانه کل این فرایند را در **۱۹ مرحلهٔ ترتیبی** و **۵ دروازهٔ تأیید** (G1 تا G5) مدیریت می‌کند:
- هر مرحله چک‌لیست، ارسال، تأیید یا رد دارد.
- تا مرحلهٔ جاری تأیید نشود، مرحلهٔ بعد باز نمی‌شود.
- بعد از تأیید، یک نسخهٔ تغییرناپذیر (Snapshot) ذخیره می‌شود.

**English:** A workflow platform that runs BAMBO's customer pilot process as a 19-stage state machine with 5 approval gates. It includes:
- OTP login with rate limiting
- role-based access control
- typed forms F01–F05
- secure DWG drawing upload with versioning
- mission scheduling with overlap detection
- incident lifecycle with SLA deadlines
- SMS notifications
- immutable hashed approval snapshots
- KPI reporting

It is built with FastAPI, SQLAlchemy and PostgreSQL, has 93 API endpoints, and is covered by backend and frontend test suites, CI and Docker Compose.

## مسئله
- فرایند پایلوت روی کاغذ و فایل اکسل پیش می‌رفت. معلوم نبود هر پرونده در کدام مرحله است و مسئولش کیست.
- مرحله‌ای ممکن بود بدون تکمیل قبلی شروع شود.
- تأییدها قابل ردیابی نبود و بعداً قابل تغییر بود.
- مهلت‌ها (SLA) و مشکلات میدانی ثبت منظم نداشتند.

## راه‌حل
| بخش | چه می‌کند |
|---|---|
| پروندهٔ پایلوت | کد یکتای `PIL-1405-001` و نام سیستمی پروژه که Backend تولید می‌کند؛ ثبت مالک، شرکت و پروژه |
| گردش‌کار ۱۹ مرحله‌ای | ارسال، تأیید، رد و اصلاح هر مرحله؛ قفل ترتیبی؛ رد بدون دلیل ممکن نیست؛ خطا دقیقاً در سطح فیلد گفته می‌شود |
| دروازه‌های G1 تا G5 | آمادگی اولیه، آمادگی نقشه و پلتفرم، عملیات برداشت، تجربهٔ مشتری، و ارزیابی تجاری |
| فرم‌های F01 تا F05 | فرم‌های تایپ‌شده مطابق فایل مرجع: هماهنگی، آمادگی، عملیات، موفقیت مشتری و رخداد |
| نقشهٔ DWG | آپلود امن (محدودیت حجم، بررسی پسوند و MIME و امضای فایل، مسیر امن)، جلوگیری از فایل تکراری با SHA-256، نسخه‌بندی |
| مأموریت میدانی | زمان‌بندی برداشت با بررسی همپوشانی زمانی و قفل ردیف در PostgreSQL؛ وضعیت جداگانه برای هر طبقه |
| رخداد (Incident) | چرخهٔ کامل از ثبت تا بستن تأییدشده؛ مهلت پاسخ بر اساس شدت (بحرانی ۳۰ دقیقه، مهم ۴ ساعت، عادی همان روز)؛ رخداد بحرانی باز دروازهٔ G4 را می‌بندد |
| ورود و دسترسی | ورود با OTP پیامکی، محدودیت تعداد درخواست و قفل تراکنشی؛ نقش‌ها و ماتریس دسترسی برای هر مرحله و دروازه؛ روشن و خاموش کردن دسترسی با یک کلید |
| اعلان | پیامک با ثبت تلاش‌ها و نتیجهٔ ارسال؛ تنظیمات اعلان برای هر کاربر |
| گزارش | ۹ شاخص (KPI) مثل درصد آپلود موفق، درصد برداشت مجدد و میانگین رضایت؛ نبود داده هیچ‌وقت صفر گزارش نمی‌شود |

## معماری
- **Backend:**
  - FastAPI با لایه‌های routers، services، schemas و models.
  - SQLAlchemy 2 و Pydantic 2.
  - PostgreSQL با Alembic (۲۴ مهاجرت).
  - ۹۳ مسیر API.
- **تغییرناپذیری:** Snapshot هر تأیید هش می‌شود و ORM جلوی تغییرش را می‌گیرد. اصلاح بعدی نسخهٔ جدید می‌سازد و Snapshot قبلی را بازنویسی نمی‌کند.
- **Frontend:** JavaScript خالص، راست‌چین، یک صفحه برای هر مرحله.
- **اجرا و استقرار:**
  - Docker Compose: دیتابیس، مهاجرت، backend و frontend.
  - GitHub Actions برای CI.
  - Runbookهای استقرار، بازگشت، و پشتیبان‌گیری و بازگردانی.
- **PDF فارسی** با WeasyPrint و فونت وزیرمتن، و تاریخ شمسی با persiantools.

## نتایج
| بررسی | نتیجه |
|---|---|
| ممیزی زنجیرهٔ کامل ۱۹ مرحله (رابط کاربری، API، دسترسی، ذخیره، اعلان، تأیید، دروازه) | ۱۹ مرحله، ۵ دروازه، ۰ خطا |
| تست‌های backend | ۲۱۸ تابع تست با pytest |
| تست‌های frontend | ۱۳۶ تست |
| مسیرهای API | ۹۳ |

## محدودیت‌ها
- Load Test واقعی هنوز اجرا نشده. هدف PRD: ۹۵٪ پاسخ‌ها زیر ۲ ثانیه.
- محاسبهٔ عبور از SLA با تقویم کاری هنوز باقی است؛ فعلاً فقط مهلت‌ها ذخیره می‌شوند.
- این سامانه عمداً قابلیت‌های پلتفرم اصلی BAMBO (تور مجازی، عکس و فیلم، داشبورد کنترل پروژه) را تکرار نمی‌کند و فقط وضعیت آن‌ها را ثبت می‌کند.

## مهارت‌هایی که نشان می‌دهد
طراحی State Machine و گردش‌کار تأیید، RBAC، احراز هویت OTP امن، آپلود امن فایل، هم‌زمانی در PostgreSQL، داده‌های تغییرناپذیر و ممیزی، طراحی KPI، Docker و CI، و مستندسازی تولید.

## سؤال‌های متداول (برای چت‌بات)
**این سامانه چه کاری می‌کند؟**
فرایند پایلوت مشتریان BAMBO را از ثبت پروژه تا پیشنهاد تجاری، در ۱۹ مرحلهٔ ترتیبی با چک‌لیست و تأیید مدیریت می‌کند.

**چرا مرحله‌ها قفل ترتیبی دارند؟**
تا هیچ کاری قبل از تأیید پیش‌نیازش شروع نشود. دروازه‌های G1 تا G5 نقاط کنترل اصلی هستند.

**Snapshot تغییرناپذیر یعنی چه؟**
بعد از تأیید هر مرحله یک نسخهٔ ثابت با هش ذخیره می‌شود. اصلاح بعدی نسخهٔ جدید می‌سازد و سابقه از بین نمی‌رود.

**امنیت ورود چطور است؟**
OTP پیامکی با محدودیت تعداد درخواست و قفل تراکنشی، و دسترسی نقش‌محور برای هر مرحله.

**فرقش با ماژول مالی BAMBO چیست؟**
ماژول مالی هزینه و گزارش مالی پروژه را مدیریت می‌کند. این سامانه فرایند عملیاتی و فروش پایلوت را مدیریت می‌کند.

**از چه فناوری‌هایی استفاده شد؟**
FastAPI، SQLAlchemy، PostgreSQL، Alembic، pytest، Docker Compose، GitHub Actions و WeasyPrint.
