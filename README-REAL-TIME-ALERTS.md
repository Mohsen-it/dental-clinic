# نظام التحديث في الوقت الفعلي للتنبيهات

## 🎯 الهدف

تم تطوير نظام شامل يضمن أن **أي تعديل يتم على أي تنبيه في النظام يتم تحديثه في الوقت الفعلي (real time) عبر كل المشروع بدون استثناء**.

## ✨ الميزات الرئيسية

### 🔄 التحديث الفوري
- أي تعديل على التنبيهات يظهر فوراً في جميع الصفحات والمكونات
- لا حاجة لإعادة تحميل الصفحة أو التحديث اليدوي
- تحديث تلقائي عند تغيير أي بيانات في النظام

### 📡 نظام الأحداث المتقدم
- نظام أحداث مباشر للتنبيهات
- إشعارات تغيير البيانات شاملة
- دعم الأحداث القديمة للتوافق

### 🎛️ مؤشرات بصرية
- مؤشر حالة الاتصال في الوقت الفعلي
- عداد التحديثات والتنبيهات غير المقروءة
- معلومات آخر تحديث

## 🏗️ البنية التقنية

### الملفات الرئيسية

```
src/
├── services/
│   └── smartAlertsService.ts          # خدمة التنبيهات مع نظام الأحداث
├── utils/
│   └── dataChangeNotifier.ts          # نظام إشعارات تغيير البيانات
├── hooks/
│   ├── useRealTimeAlerts.ts           # Hook للتحديثات في الوقت الفعلي
│   └── useDataChangeNotifications.ts  # Hook لإشعارات تغيير البيانات
├── components/global/
│   ├── SmartAlerts.tsx                # مكون التنبيهات المحدث
│   └── RealTimeIndicator.tsx          # مؤشر التحديثات في الوقت الفعلي
├── store/
│   └── globalStore.ts                 # Store محدث مع نظام الأحداث
├── docs/
│   └── real-time-alerts-system.md     # توثيق شامل للنظام
└── examples/
    └── RealTimeAlertsExample.tsx      # مثال عملي للاستخدام
```

## 🚀 كيفية الاستخدام

### 1. في أي مكون يعرض التنبيهات

```tsx
import { useRealTimeAlerts } from '@/hooks/useRealTimeAlerts'

function MyAlertsComponent() {
  // إعداد التحديثات التلقائية
  useRealTimeAlerts()
  
  // المكون سيتلقى تحديثات فورية تلقائياً
  return <SmartAlerts />
}
```

### 2. عند تعديل البيانات

```tsx
import { useDataNotifier } from '@/hooks/useDataChangeNotifications'

function PatientForm() {
  const { notifyPatientUpdated } = useDataNotifier()
  
  const handleSave = async (patient) => {
    await updatePatient(patient)
    
    // إرسال إشعار التحديث - سيؤدي لتحديث التنبيهات تلقائياً
    notifyPatientUpdated(patient.id, patient)
  }
}
```

### 3. تحديث التنبيهات مباشرة

```tsx
import { SmartAlertsService } from '@/services/smartAlertsService'

// تحديث تنبيه - سيظهر التحديث فوراً في كل مكان
await SmartAlertsService.updateAlert(alertId, {
  isRead: true,
  title: 'عنوان محدث'
})

// إنشاء تنبيه جديد - سيظهر فوراً في كل مكان
await SmartAlertsService.createAlert({
  type: 'custom',
  title: 'تنبيه جديد',
  description: 'وصف التنبيه',
  priority: 'high'
})

// حذف تنبيه - سيختفي فوراً من كل مكان
await SmartAlertsService.deleteAlert(alertId)
```

### 4. إضافة مؤشر التحديثات

```tsx
import { FullRealTimeIndicator } from '@/components/global/RealTimeIndicator'

function Dashboard() {
  return (
    <div>
      <FullRealTimeIndicator />
      {/* باقي المحتوى */}
    </div>
  )
}
```

## 🔧 الإعدادات

### فترات التحديث
- **التحديث الدوري**: 30 ثانية (مخفض من 10 ثواني لتوفير الموارد)
- **فحص الاتصال**: 30 ثانية
- **انقطاع الاتصال**: دقيقتان بدون تحديث

### أنواع الأحداث المدعومة

#### أحداث التنبيهات
- `alerts:changed` - تغيير عام
- `alert:updated` - تحديث تنبيه
- `alert:created` - إنشاء تنبيه
- `alert:deleted` - حذف تنبيه

#### أحداث البيانات
- `patient:*` - أحداث المرضى
- `appointment:*` - أحداث المواعيد
- `payment:*` - أحداث الدفعات
- `treatment:*` - أحداث العلاجات
- `prescription:*` - أحداث الوصفات
- `inventory:*` - أحداث المخزون
- `need:*` - أحداث الاحتياجات

## 📊 مراقبة الأداء

### في وحدة التحكم (Console)
```
🔔 Emitting alert event: alert:updated {alertId: "123", updates: {...}}
📡 Data change event: patient:updated {id: "456", type: "patient", ...}
🔄 Real-time alerts refresh triggered
✅ Alert updated in database: 123 {isRead: true}
```

### مؤشرات بصرية
- 🟢 أخضر: متصل ويعمل بشكل طبيعي
- 🔴 أحمر: منقطع أو مشكلة في الاتصال
- 🔔 عداد التنبيهات غير المقروءة
- ⏰ آخر وقت تحديث

## 🛠️ استكشاف الأخطاء

### المشاكل الشائعة

#### 1. التحديثات لا تظهر فوراً
```tsx
// تأكد من استخدام useRealTimeAlerts
import { useRealTimeAlerts } from '@/hooks/useRealTimeAlerts'

function MyComponent() {
  useRealTimeAlerts() // ✅ مطلوب
  // ...
}
```

#### 2. الأحداث لا تُرسل
```tsx
// تأكد من إرسال الإشعارات بعد تحديث البيانات
const handleUpdate = async () => {
  await updateData()
  notifyDataUpdated(id, data) // ✅ مطلوب
}
```

#### 3. تسريب الذاكرة
```tsx
// تأكد من تنظيف المستمعين
useEffect(() => {
  const cleanup = setupListeners()
  return cleanup // ✅ مطلوب
}, [])
```

## 📈 الفوائد

### للمطورين
- كود أقل وأبسط
- لا حاجة لإدارة التحديثات يدوياً
- نظام موحد لجميع التحديثات

### للمستخدمين
- تجربة أسرع وأكثر تفاعلية
- معلومات محدثة دائماً
- لا حاجة لإعادة تحميل الصفحة

### للنظام
- استهلاك أقل للموارد
- أداء أفضل
- موثوقية أعلى

## 🔮 التطوير المستقبلي

### مخطط له
- [ ] دعم WebSocket للتحديثات الفورية
- [ ] ضغط الأحداث المتتالية
- [ ] إشعارات push للمتصفح
- [ ] تزامن عبر علامات تبويب متعددة

### قيد الدراسة
- [ ] تحليلات أداء متقدمة
- [ ] تخزين مؤقت ذكي
- [ ] دعم العمل بدون اتصال

## 📞 الدعم

للمساعدة أو الاستفسارات:
1. راجع التوثيق في `src/docs/real-time-alerts-system.md`
2. انظر المثال العملي في `src/examples/RealTimeAlertsExample.tsx`
3. تحقق من وحدة التحكم للرسائل التشخيصية

---

**ملاحظة**: هذا النظام يضمن أن أي تعديل على أي تنبيه في النظام يتم تحديثه في الوقت الفعلي عبر كل المشروع بدون استثناء، كما هو مطلوب.
