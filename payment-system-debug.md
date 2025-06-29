# تشخيص مشاكل نظام المدفوعات

## 🔍 المشكلة المبلغة
"النظام لا يحفظ عندما أضع مبلغ إجمالي"

## 🛠️ الإصلاحات المطبقة

### 1. **إصلاح إرسال البيانات**
- ✅ إضافة `total_amount_due` لجميع المدفوعات
- ✅ إصلاح منطق حساب المبلغ المدفوع والمتبقي
- ✅ إزالة الاعتماد على `getAppointmentCost`

### 2. **إضافة Logging مفصل**
- ✅ تتبع بيانات النموذج قبل الإرسال
- ✅ تتبع عملية validation
- ✅ تتبع البيانات المرسلة لقاعدة البيانات

### 3. **إصلاح واجهة المستخدم**
- ✅ تحديث عرض "المبلغ الإجمالي المطلوب" بدلاً من "تكلفة الموعد"
- ✅ إصلاح حساب المتبقي بناءً على المبلغ المدخل

## 🧪 خطوات الاختبار

### **الاختبار الأساسي:**
1. افتح حوار إضافة دفعة
2. اختر مريض
3. أدخل المبلغ الإجمالي المطلوب: `100`
4. أدخل مبلغ الدفعة: `40`
5. اضغط حفظ
6. تحقق من Console للرسائل التالية:
   ```
   🚀 Starting form submission...
   📝 Current form data: {...}
   ✅ Form validation passed
   💰 Submitting payment data: {...}
   ✅ Payment created successfully: {...}
   ```

### **التحقق من البيانات:**
- تأكد أن `total_amount_due: 100` موجود في البيانات المرسلة
- تأكد أن `amount: 40` موجود في البيانات المرسلة
- تأكد أن `status: "partial"` (لأن 40 < 100)

### **التحقق من قاعدة البيانات:**
- افتح قاعدة البيانات وتحقق من جدول `payments`
- تأكد أن السجل الجديد محفوظ مع:
  - `total_amount_due = 100`
  - `amount = 40`
  - `status = 'partial'`

## 🔧 إذا استمرت المشكلة

### **تحقق من Console:**
1. افتح Developer Tools (F12)
2. اذهب إلى Console
3. جرب إضافة دفعة
4. ابحث عن رسائل الخطأ

### **رسائل الخطأ المحتملة:**
- `❌ Form validation failed` - مشكلة في validation
- `❌ Failed to create payment` - مشكلة في قاعدة البيانات
- `❌ Failed to submit payment` - مشكلة في الإرسال

### **حلول المشاكل الشائعة:**

#### **مشكلة Validation:**
```
🔍 Validation check: {
  total_amount_due: "",  // ← فارغ!
  amount: "40",
  errors: { total_amount_due: "المبلغ الإجمالي المطلوب مطلوب..." }
}
```
**الحل**: تأكد من إدخال المبلغ الإجمالي المطلوب

#### **مشكلة قاعدة البيانات:**
```
❌ Failed to create payment: Error: SQLITE_ERROR: no such column
```
**الحل**: تحقق من schema قاعدة البيانات

#### **مشكلة الشبكة:**
```
❌ Failed to submit payment: TypeError: Cannot read property...
```
**الحل**: تحقق من اتصال Electron API

## 📊 البيانات المتوقعة

### **بيانات النموذج:**
```javascript
{
  patient_id: "patient-123",
  appointment_id: "appointment-456", // أو "none"
  amount: "40",
  total_amount_due: "100",
  payment_method: "cash",
  payment_date: "2024-01-15",
  status: "partial" // محسوب تلقائياً
}
```

### **البيانات المرسلة:**
```javascript
{
  patient_id: "patient-123",
  appointment_id: "appointment-456",
  amount: 40,
  total_amount_due: 100,
  amount_paid: 40,
  remaining_balance: 60,
  status: "partial",
  // ... باقي الحقول
}
```

### **البيانات المحفوظة:**
```sql
INSERT INTO payments (
  id, patient_id, appointment_id, amount, 
  total_amount_due, amount_paid, remaining_balance, 
  status, ...
) VALUES (
  'payment-789', 'patient-123', 'appointment-456', 40,
  100, 40, 60,
  'partial', ...
)
```

## ✅ التأكد من النجاح

### **في الواجهة:**
- ✅ رسالة "تم تسجيل الدفعة بنجاح"
- ✅ إغلاق الحوار تلقائياً
- ✅ ظهور الدفعة في قائمة المدفوعات
- ✅ عرض الحالة "جزئي" بشكل صحيح

### **في Console:**
- ✅ `✅ Payment created successfully`
- ✅ لا توجد رسائل خطأ
- ✅ البيانات المرسلة صحيحة

### **في قاعدة البيانات:**
- ✅ سجل جديد في جدول `payments`
- ✅ جميع الحقول محفوظة بشكل صحيح
- ✅ الحسابات دقيقة

## 🎯 النتيجة المتوقعة

بعد هذه الإصلاحات، النظام يجب أن:
1. ✅ يقبل المبلغ الإجمالي المدخل يدوياً
2. ✅ يحفظ الدفعة من المرة الأولى
3. ✅ يحدد الحالة تلقائياً (جزئي إذا كان المبلغ أقل من الإجمالي)
4. ✅ يعرض البيانات بشكل صحيح في الواجهة
5. ✅ يحفظ جميع البيانات في قاعدة البيانات

**إذا استمرت المشكلة، يرجى مشاركة رسائل Console للمساعدة في التشخيص! 🔍**
