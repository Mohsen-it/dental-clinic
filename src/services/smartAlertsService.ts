import type {
  SmartAlert,
  CrossReferencedAlert,
  Patient,
  Appointment,
  Payment,
  ToothTreatment,
  Prescription
} from '@/types'

/**
 * نظام الأحداث للتحديث في الوقت الفعلي
 */
class AlertsEventSystem {
  private static listeners: Map<string, Set<Function>> = new Map()

  static addEventListener(event: string, callback: Function) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set())
    }
    this.listeners.get(event)!.add(callback)
  }

  static removeEventListener(event: string, callback: Function) {
    if (this.listeners.has(event)) {
      this.listeners.get(event)!.delete(callback)
    }
  }

  static emit(event: string, data?: any) {
    console.log(`🔔 Emitting alert event: ${event}`, data)
    if (this.listeners.has(event)) {
      this.listeners.get(event)!.forEach(callback => {
        try {
          callback(data)
        } catch (error) {
          console.error(`Error in alert event listener for ${event}:`, error)
        }
      })
    }

    // أيضاً إرسال الحدث عبر window للمكونات الأخرى
    window.dispatchEvent(new CustomEvent(`alerts:${event}`, { detail: data }))
  }

  static removeAllListeners() {
    this.listeners.clear()
  }
}

/**
 * خدمة التنبيهات الذكية
 * تولد تنبيهات مترابطة وذكية بناءً على البيانات
 * مع دعم التحديث في الوقت الفعلي
 */
export class SmartAlertsService {

  /**
   * جلب جميع التنبيهات الذكية
   */
  static async getAllAlerts(): Promise<SmartAlert[]> {
    try {
      console.log('🔄 Starting to load all alerts...')

      // جلب التنبيهات المحفوظة من قاعدة البيانات
      const savedAlerts = await window.electronAPI?.smartAlerts?.getAll?.() || []
      console.log('📋 Loaded saved alerts from database:', savedAlerts.length)

      // تنظيف التنبيهات القديمة والمنتهية الصلاحية
      await this.cleanupOutdatedAlerts()

      // توليد تنبيهات جديدة من البيانات الحقيقية
      const generatedAlerts = await this.generateSmartAlerts()
      console.log('🔄 Generated new alerts from real data:', generatedAlerts.length)

      // حفظ التنبيهات الجديدة في قاعدة البيانات
      for (const alert of generatedAlerts) {
        try {
          // تحقق من عدم وجود التنبيه مسبقاً
          const existingAlert = savedAlerts.find(saved => saved.id === alert.id)
          if (!existingAlert) {
            await window.electronAPI?.smartAlerts?.create?.(alert)
            console.log('💾 Saved new alert to database:', alert.id, alert.title)
          }
        } catch (error) {
          console.error('Error saving alert to database:', error)
        }
      }

      // دمج التنبيهات وإزالة المكررات
      const allAlerts = [...savedAlerts, ...generatedAlerts]
      const uniqueAlerts = this.removeDuplicateAlerts(allAlerts)

      // تنظيف التنبيهات المؤجلة المنتهية الصلاحية
      await this.clearExpiredSnoozedAlerts()

      // ترتيب حسب الأولوية والتاريخ
      const sortedAlerts = this.sortAlertsByPriority(uniqueAlerts)

      console.log('✅ Final alerts count:', sortedAlerts.length)
      console.log('📊 Alert breakdown:', {
        total: sortedAlerts.length,
        unread: sortedAlerts.filter(a => !a.isRead).length,
        undismissed: sortedAlerts.filter(a => !a.isDismissed).length,
        actionRequired: sortedAlerts.filter(a => a.actionRequired).length
      })

      return sortedAlerts

    } catch (error) {
      console.error('❌ Error getting all alerts:', error)
      return []
    }
  }

  /**
   * توليد تنبيهات ذكية جديدة
   */
  private static async generateSmartAlerts(): Promise<SmartAlert[]> {
    const alerts: SmartAlert[] = []

    try {
      console.log('🔄 Generating alerts from real data...')

      // تنبيهات المواعيد
      const appointmentAlerts = await this.generateAppointmentAlerts()
      console.log('📅 Generated appointment alerts:', appointmentAlerts.length)
      alerts.push(...appointmentAlerts)

      // تنبيهات الدفعات
      const paymentAlerts = await this.generatePaymentAlerts()
      console.log('💰 Generated payment alerts:', paymentAlerts.length)
      alerts.push(...paymentAlerts)

      // تنبيهات العلاجات
      const treatmentAlerts = await this.generateTreatmentAlerts()
      console.log('🦷 Generated treatment alerts:', treatmentAlerts.length)
      alerts.push(...treatmentAlerts)

      // تنبيهات الوصفات
      const prescriptionAlerts = await this.generatePrescriptionAlerts()
      console.log('💊 Generated prescription alerts:', prescriptionAlerts.length)
      alerts.push(...prescriptionAlerts)

      // تنبيهات المتابعة
      const followUpAlerts = await this.generateFollowUpAlerts()
      console.log('👤 Generated follow-up alerts:', followUpAlerts.length)
      alerts.push(...followUpAlerts)

      // تنبيهات المخزون والاحتياجات
      const inventoryAlerts = await this.generateInventoryAlerts()
      console.log('📦 Generated inventory alerts:', inventoryAlerts.length)
      alerts.push(...inventoryAlerts)

      // تنبيهات المختبرات
      const labOrderAlerts = await this.generateLabOrderAlerts()
      console.log('🧪 Generated lab order alerts:', labOrderAlerts.length)
      alerts.push(...labOrderAlerts)

      // تنبيهات احتياجات العيادة
      const clinicNeedsAlerts = await this.generateClinicNeedsAlerts()
      console.log('🏥 Generated clinic needs alerts:', clinicNeedsAlerts.length)
      alerts.push(...clinicNeedsAlerts)

      console.log('✅ Total generated alerts:', alerts.length)

    } catch (error) {
      console.error('❌ Error generating smart alerts:', error)
    }

    return alerts
  }

  /**
   * توليد تنبيهات المواعيد
   */
  private static async generateAppointmentAlerts(): Promise<SmartAlert[]> {
    const alerts: SmartAlert[] = []

    try {
      const appointments = await window.electronAPI?.appointments?.getAll?.() || []
      console.log('📅 Checking appointments for alerts:', appointments.length)

      const today = new Date()
      const tomorrow = new Date(today)
      tomorrow.setDate(tomorrow.getDate() + 1)

      appointments.forEach((appointment: Appointment) => {
        // تحقق من صحة التاريخ
        if (!appointment.start_time) {
          console.warn('Appointment missing start_time:', appointment.id)
          return
        }

        const appointmentDate = new Date(appointment.start_time)

        // تحقق من صحة التاريخ
        if (isNaN(appointmentDate.getTime())) {
          console.warn('Invalid appointment date:', appointment.start_time, 'for appointment:', appointment.id)
          return
        }

        // تنبيه للمواعيد اليوم
        if (this.isSameDay(appointmentDate, today) && appointment.status === 'scheduled') {
          alerts.push({
            id: `appointment_today_${appointment.id}`,
            type: 'appointment',
            priority: 'high',
            title: `موعد اليوم - ${appointment.patient?.full_name || 'مريض غير محدد'}`,
            description: `موعد مجدول اليوم في ${this.formatTime(appointment.start_time)} - ${appointment.title}`,
            patientId: appointment.patient_id,
            patientName: appointment.patient?.full_name,
            relatedData: {
              appointmentId: appointment.id
            },
            actionRequired: true,
            dueDate: appointment.start_time,
            createdAt: new Date().toISOString(),
            isRead: false,
            isDismissed: false
          })
        }

        // تنبيه للمواعيد غداً
        if (this.isSameDay(appointmentDate, tomorrow) && appointment.status === 'scheduled') {
          alerts.push({
            id: `appointment_tomorrow_${appointment.id}`,
            type: 'appointment',
            priority: 'medium',
            title: `موعد غداً - ${appointment.patient?.full_name || 'مريض غير محدد'}`,
            description: `موعد مجدول غداً في ${this.formatTime(appointment.start_time)} - ${appointment.title}`,
            patientId: appointment.patient_id,
            patientName: appointment.patient?.full_name,
            relatedData: {
              appointmentId: appointment.id
            },
            actionRequired: false,
            dueDate: appointment.start_time,
            createdAt: new Date().toISOString(),
            isRead: false,
            isDismissed: false
          })
        }

        // تنبيه للمواعيد المتأخرة
        if (appointmentDate < today && appointment.status === 'scheduled') {
          const daysLate = Math.floor((today.getTime() - appointmentDate.getTime()) / (1000 * 60 * 60 * 24))
          alerts.push({
            id: `appointment_overdue_${appointment.id}`,
            type: 'appointment',
            priority: 'high',
            title: `موعد متأخر - ${appointment.patient?.full_name || 'مريض غير محدد'}`,
            description: `موعد متأخر منذ ${daysLate} يوم - ${appointment.title}`,
            patientId: appointment.patient_id,
            patientName: appointment.patient?.full_name,
            relatedData: {
              appointmentId: appointment.id
            },
            actionRequired: true,
            dueDate: appointment.start_time,
            createdAt: new Date().toISOString(),
            isRead: false,
            isDismissed: false
          })
        }

        // تنبيه للمواعيد المؤكدة التي تحتاج تذكير (2-6 ساعات قبل الموعد)
        if ((appointment.status === 'confirmed' || appointment.status === 'scheduled') && this.isSameDay(appointmentDate, today)) {
          const appointmentTime = new Date(appointment.start_time)
          const currentTime = new Date()
          const hoursUntilAppointment = (appointmentTime.getTime() - currentTime.getTime()) / (1000 * 60 * 60)

          // تذكير قبل 2-6 ساعات من الموعد كما هو محدد في المتطلبات
          if (hoursUntilAppointment <= 6 && hoursUntilAppointment >= 2) {
            alerts.push({
              id: `appointment_reminder_${appointment.id}`,
              type: 'appointment',
              priority: 'medium',
              title: `تذكير موعد - ${appointment.patient?.full_name || 'مريض غير محدد'}`,
              description: `موعد خلال ${Math.round(hoursUntilAppointment)} ساعة - ${appointment.title}`,
              patientId: appointment.patient_id,
              patientName: appointment.patient?.full_name,
              relatedData: {
                appointmentId: appointment.id
              },
              actionRequired: false,
              dueDate: appointment.start_time,
              createdAt: new Date().toISOString(),
              isRead: false,
              isDismissed: false
            })
          }
        }
      })

    } catch (error) {
      console.error('Error generating appointment alerts:', error)
    }

    return alerts
  }

  /**
   * توليد تنبيهات الدفعات
   */
  private static async generatePaymentAlerts(): Promise<SmartAlert[]> {
    const alerts: SmartAlert[] = []

    try {
      const payments = await window.electronAPI?.payments?.getAll?.() || []
      const today = new Date()

      payments.forEach((payment: Payment) => {
        // تنبيه للدفعات المعلقة
        if (payment.status === 'pending' && payment.remaining_balance && payment.remaining_balance > 0) {
          // تحقق من صحة التاريخ
          if (!payment.payment_date) {
            console.warn('Payment missing payment_date:', payment.id)
            return
          }

          const paymentDate = new Date(payment.payment_date)

          // تحقق من صحة التاريخ
          if (isNaN(paymentDate.getTime())) {
            console.warn('Invalid payment date:', payment.payment_date, 'for payment:', payment.id)
            return
          }

          const daysOverdue = Math.floor((today.getTime() - paymentDate.getTime()) / (1000 * 60 * 60 * 24))

          if (daysOverdue > 0) {
            alerts.push({
              id: `payment_overdue_${payment.id}`,
              type: 'payment',
              priority: daysOverdue > 7 ? 'high' : 'medium',
              title: `دفعة معلقة - ${payment.patient?.full_name || 'مريض غير محدد'}`,
              description: `دفعة معلقة منذ ${daysOverdue} يوم - المبلغ: ${payment.remaining_balance}$`,
              patientId: payment.patient_id,
              patientName: payment.patient?.full_name,
              relatedData: {
                paymentId: payment.id,
                appointmentId: payment.appointment_id
              },
              actionRequired: true,
              dueDate: payment.payment_date,
              createdAt: new Date().toISOString(),
              isRead: false,
              isDismissed: false
            })
          }
        }

        // تنبيه للدفعات الجزئية
        if (payment.status === 'partial' && payment.remaining_balance && payment.remaining_balance > 0) {
          alerts.push({
            id: `payment_partial_${payment.id}`,
            type: 'payment',
            priority: 'medium',
            title: `دفعة جزئية - ${payment.patient?.full_name || 'مريض غير محدد'}`,
            description: `تم دفع ${payment.amount}$ من أصل ${payment.amount + payment.remaining_balance}$ - المتبقي: ${payment.remaining_balance}$`,
            patientId: payment.patient_id,
            patientName: payment.patient?.full_name,
            relatedData: {
              paymentId: payment.id,
              appointmentId: payment.appointment_id
            },
            actionRequired: true,
            dueDate: payment.payment_date,
            createdAt: new Date().toISOString(),
            isRead: false,
            isDismissed: false
          })
        }

        // تنبيه للدفعات المرفوضة
        if (payment.status === 'failed' || payment.status === 'rejected') {
          alerts.push({
            id: `payment_failed_${payment.id}`,
            type: 'payment',
            priority: 'high',
            title: `دفعة مرفوضة - ${payment.patient?.full_name || 'مريض غير محدد'}`,
            description: `دفعة بقيمة ${payment.amount}$ تم رفضها - ${payment.notes || 'بحاجة لمراجعة'}`,
            patientId: payment.patient_id,
            patientName: payment.patient?.full_name,
            relatedData: {
              paymentId: payment.id,
              appointmentId: payment.appointment_id
            },
            actionRequired: true,
            dueDate: payment.payment_date,
            createdAt: new Date().toISOString(),
            isRead: false,
            isDismissed: false
          })
        }
      })

    } catch (error) {
      console.error('Error generating payment alerts:', error)
    }

    return alerts
  }

  /**
   * توليد تنبيهات العلاجات
   */
  private static async generateTreatmentAlerts(): Promise<SmartAlert[]> {
    const alerts: SmartAlert[] = []

    try {
      const treatments = await window.electronAPI?.toothTreatments?.getAll?.() || []
      const today = new Date()

      treatments.forEach((treatment: ToothTreatment) => {
        // تنبيه للعلاجات المعلقة لفترة طويلة
        if (treatment.treatment_status === 'planned' || treatment.treatment_status === 'in_progress') {
          const createdDate = new Date(treatment.created_at)
          const daysPending = Math.floor((today.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24))

          if (daysPending > 14) { // أكثر من أسبوعين
            alerts.push({
              id: `treatment_pending_${treatment.id}`,
              type: 'treatment',
              priority: daysPending > 30 ? 'high' : 'medium',
              title: `علاج معلق - ${treatment.patient?.full_name || 'مريض غير محدد'}`,
              description: `علاج ${treatment.treatment_type} للسن ${treatment.tooth_number} معلق منذ ${daysPending} يوم`,
              patientId: treatment.patient_id,
              patientName: treatment.patient?.full_name,
              relatedData: {
                treatmentId: treatment.id,
                appointmentId: treatment.appointment_id
              },
              actionRequired: true,
              createdAt: new Date().toISOString(),
              isRead: false,
              isDismissed: false
            })
          }
        }

        // تنبيه للعلاجات التي تحتاج متابعة
        if (treatment.treatment_status === 'completed' && treatment.notes && treatment.notes.includes('متابعة')) {
          const treatmentDate = new Date(treatment.updated_at || treatment.created_at)
          const daysSinceCompletion = Math.floor((today.getTime() - treatmentDate.getTime()) / (1000 * 60 * 60 * 24))

          if (daysSinceCompletion > 7) { // أكثر من أسبوع
            alerts.push({
              id: `treatment_followup_${treatment.id}`,
              type: 'treatment',
              priority: 'medium',
              title: `متابعة علاج - ${treatment.patient?.full_name || 'مريض غير محدد'}`,
              description: `علاج ${treatment.treatment_type} للسن ${treatment.tooth_number} يحتاج متابعة`,
              patientId: treatment.patient_id,
              patientName: treatment.patient?.full_name,
              relatedData: {
                treatmentId: treatment.id,
                appointmentId: treatment.appointment_id
              },
              actionRequired: true,
              createdAt: new Date().toISOString(),
              isRead: false,
              isDismissed: false
            })
          }
        }

        // تنبيه للعلاجات المعقدة التي تحتاج عدة جلسات
        if (treatment.treatment_type && ['تقويم', 'زراعة', 'علاج عصب', 'تركيب'].some(type => treatment.treatment_type.includes(type))) {
          const treatmentDate = new Date(treatment.created_at)
          const daysSinceStart = Math.floor((today.getTime() - treatmentDate.getTime()) / (1000 * 60 * 60 * 24))

          if (daysSinceStart > 21 && treatment.treatment_status !== 'completed') { // أكثر من 3 أسابيع
            alerts.push({
              id: `treatment_complex_${treatment.id}`,
              type: 'treatment',
              priority: 'medium',
              title: `علاج معقد - ${treatment.patient?.full_name || 'مريض غير محدد'}`,
              description: `علاج ${treatment.treatment_type} للسن ${treatment.tooth_number} قيد التنفيذ منذ ${daysSinceStart} يوم`,
              patientId: treatment.patient_id,
              patientName: treatment.patient?.full_name,
              relatedData: {
                treatmentId: treatment.id,
                appointmentId: treatment.appointment_id
              },
              actionRequired: false,
              createdAt: new Date().toISOString(),
              isRead: false,
              isDismissed: false
            })
          }
        }
      })

    } catch (error) {
      console.error('Error generating treatment alerts:', error)
    }

    return alerts
  }

  /**
   * توليد تنبيهات الوصفات
   */
  private static async generatePrescriptionAlerts(): Promise<SmartAlert[]> {
    const alerts: SmartAlert[] = []

    try {
      const prescriptions = await window.electronAPI?.prescriptions?.getAll?.() || []
      const today = new Date()

      prescriptions.forEach((prescription: Prescription) => {
        const prescriptionDate = new Date(prescription.prescription_date)
        const daysSince = Math.floor((today.getTime() - prescriptionDate.getTime()) / (1000 * 60 * 60 * 24))

        // تنبيه للوصفات القديمة (قد تحتاج تجديد)
        if (daysSince > 30) {
          alerts.push({
            id: `prescription_old_${prescription.id}`,
            type: 'prescription',
            priority: 'medium',
            title: `وصفة قديمة - ${prescription.patient?.full_name || 'مريض غير محدد'}`,
            description: `وصفة صادرة منذ ${daysSince} يوم - قد تحتاج تجديد`,
            patientId: prescription.patient_id,
            patientName: prescription.patient?.full_name,
            relatedData: {
              prescriptionId: prescription.id,
              appointmentId: prescription.appointment_id,
              treatmentId: prescription.tooth_treatment_id
            },
            actionRequired: false,
            createdAt: new Date().toISOString(),
            isRead: false,
            isDismissed: false
          })
        }

        // تنبيه للوصفات التي تحتاج متابعة
        if (prescription.notes && prescription.notes.includes('متابعة') && daysSince > 7) {
          alerts.push({
            id: `prescription_followup_${prescription.id}`,
            type: 'prescription',
            priority: 'medium',
            title: `متابعة وصفة - ${prescription.patient?.full_name || 'مريض غير محدد'}`,
            description: `وصفة تحتاج متابعة منذ ${daysSince} يوم - ${prescription.notes}`,
            patientId: prescription.patient_id,
            patientName: prescription.patient?.full_name,
            relatedData: {
              prescriptionId: prescription.id,
              appointmentId: prescription.appointment_id,
              treatmentId: prescription.tooth_treatment_id,
              daysSince: daysSince
            },
            actionRequired: true,
            createdAt: new Date().toISOString(),
            isRead: false,
            isDismissed: false
          })
        }

        // تنبيه للوصفات التي تحتوي على أدوية مهمة
        if (prescription.notes && (prescription.notes.includes('مضاد حيوي') || prescription.notes.includes('مسكن قوي'))) {
          if (daysSince > 14) { // أكثر من أسبوعين
            alerts.push({
              id: `prescription_important_med_${prescription.id}`,
              type: 'prescription',
              priority: 'medium',
              title: `وصفة أدوية مهمة - ${prescription.patient?.full_name || 'مريض غير محدد'}`,
              description: `وصفة تحتوي على أدوية مهمة منذ ${daysSince} يوم - تحتاج متابعة`,
              patientId: prescription.patient_id,
              patientName: prescription.patient?.full_name,
              relatedData: {
                prescriptionId: prescription.id,
                appointmentId: prescription.appointment_id,
                treatmentId: prescription.tooth_treatment_id,
                medicationType: 'important'
              },
              actionRequired: true,
              createdAt: new Date().toISOString(),
              isRead: false,
              isDismissed: false
            })
          }
        }

        // تنبيه للوصفات بدون ملاحظات (قد تحتاج توضيح)
        if (!prescription.notes || prescription.notes.trim() === '') {
          alerts.push({
            id: `prescription_no_notes_${prescription.id}`,
            type: 'prescription',
            priority: 'low',
            title: `وصفة بدون ملاحظات - ${prescription.patient?.full_name || 'مريض غير محدد'}`,
            description: `وصفة صادرة منذ ${daysSince} يوم بدون ملاحظات - قد تحتاج توضيح`,
            patientId: prescription.patient_id,
            patientName: prescription.patient?.full_name,
            relatedData: {
              prescriptionId: prescription.id,
              appointmentId: prescription.appointment_id,
              treatmentId: prescription.tooth_treatment_id
            },
            actionRequired: false,
            createdAt: new Date().toISOString(),
            isRead: false,
            isDismissed: false
          })
        }
      })

      // فحص الأدوية في المخزون للتنبيهات المتعلقة بالوصفات
      const medications = await window.electronAPI?.medications?.getAll?.() || []
      medications.forEach((medication: any) => {
        // تنبيه للأدوية منتهية الصلاحية
        if (medication.expiry_date) {
          const expiryDate = new Date(medication.expiry_date)
          const daysUntilExpiry = Math.floor((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

          if (daysUntilExpiry <= 30 && daysUntilExpiry >= 0) {
            alerts.push({
              id: `medication_expiry_warning_${medication.id}`,
              type: 'prescription',
              priority: daysUntilExpiry <= 7 ? 'high' : 'medium',
              title: `دواء قريب الانتهاء - ${medication.name}`,
              description: `ينتهي خلال ${daysUntilExpiry} يوم - قد يؤثر على الوصفات الجديدة`,
              relatedData: {
                medicationId: medication.id,
                medicationName: medication.name,
                expiryDate: medication.expiry_date,
                daysUntilExpiry: daysUntilExpiry
              },
              actionRequired: true,
              createdAt: new Date().toISOString(),
              isRead: false,
              isDismissed: false
            })
          }
        }

        // تنبيه للأدوية المنخفضة في المخزون
        if (medication.quantity <= (medication.min_quantity || 10)) {
          alerts.push({
            id: `medication_low_stock_${medication.id}`,
            type: 'prescription',
            priority: medication.quantity === 0 ? 'high' : 'medium',
            title: `دواء منخفض في المخزون - ${medication.name}`,
            description: `الكمية المتبقية: ${medication.quantity} - قد يؤثر على الوصفات`,
            relatedData: {
              medicationId: medication.id,
              medicationName: medication.name,
              currentQuantity: medication.quantity,
              minimumQuantity: medication.min_quantity || 10
            },
            actionRequired: true,
            createdAt: new Date().toISOString(),
            isRead: false,
            isDismissed: false
          })
        }
      })

    } catch (error) {
      console.error('Error generating prescription alerts:', error)
    }

    return alerts
  }

  /**
   * توليد تنبيهات المتابعة
   */
  private static async generateFollowUpAlerts(): Promise<SmartAlert[]> {
    const alerts: SmartAlert[] = []

    try {
      const appointments = await window.electronAPI?.appointments?.getAll?.() || []
      const today = new Date()

      // البحث عن المرضى الذين لم يزوروا العيادة لفترة طويلة
      const patientLastVisit: { [key: string]: Date } = {}

      appointments.forEach((appointment: Appointment) => {
        if (appointment.status === 'completed' && appointment.patient_id) {
          const appointmentDate = new Date(appointment.start_time)
          if (!patientLastVisit[appointment.patient_id] || appointmentDate > patientLastVisit[appointment.patient_id]) {
            patientLastVisit[appointment.patient_id] = appointmentDate
          }
        }
      })

      // إنشاء تنبيهات للمرضى الذين لم يزوروا لفترة طويلة
      for (const [patientId, lastVisit] of Object.entries(patientLastVisit)) {
        const daysSinceLastVisit = Math.floor((today.getTime() - lastVisit.getTime()) / (1000 * 60 * 60 * 24))

        if (daysSinceLastVisit > 90) { // أكثر من 3 أشهر كما هو محدد في المتطلبات
          try {
            // الحصول على بيانات المريض
            const patient = await window.electronAPI?.patients?.getById?.(patientId)
            if (patient) {
              alerts.push({
                id: `follow_up_${patientId}`,
                type: 'follow_up',
                priority: 'low',
                title: `متابعة مطلوبة - ${patient.full_name}`,
                description: `لم يزر المريض العيادة منذ ${daysSinceLastVisit} يوم - قد يحتاج متابعة`,
                patientId: patient.id,
                patientName: patient.full_name,
                relatedData: {},
                actionRequired: false,
                createdAt: new Date().toISOString(),
                isRead: false,
                isDismissed: false
              })
            }
          } catch (error) {
            console.error('Error getting patient data for follow-up alert:', error)
          }
        }
      }

    } catch (error) {
      console.error('Error generating follow-up alerts:', error)
    }

    return alerts
  }



  /**
   * إنشاء تنبيه جديد مع إشعار في الوقت الفعلي
   */
  static async createAlert(alert: Omit<SmartAlert, 'id' | 'createdAt'>): Promise<SmartAlert> {
    const newAlert: SmartAlert = {
      ...alert,
      id: `custom_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString()
    }

    try {
      await window.electronAPI?.smartAlerts?.create?.(newAlert)

      // إرسال حدث الإنشاء في الوقت الفعلي
      AlertsEventSystem.emit('alert:created', { alert: newAlert })
      AlertsEventSystem.emit('alerts:changed')

      return newAlert
    } catch (error) {
      console.error('Error creating alert:', error)
      throw error
    }
  }

  /**
   * حذف التنبيهات المرتبطة بموعد معين
   */
  static async deleteAppointmentAlerts(appointmentId: string): Promise<void> {
    try {
      console.log('🗑️ Deleting alerts for appointment:', appointmentId)
      const alerts = await window.electronAPI?.smartAlerts?.getAll?.() || []

      let deletedCount = 0
      for (const alert of alerts) {
        if (alert.type === 'appointment' && alert.relatedData?.appointmentId === appointmentId) {
          try {
            await window.electronAPI?.smartAlerts?.delete?.(alert.id)
            deletedCount++
          } catch (error) {
            console.warn('Error deleting appointment alert:', alert.id, error)
          }
        }
      }

      console.log(`🗑️ Deleted ${deletedCount} alerts for appointment ${appointmentId}`)

      // إرسال حدث التحديث في الوقت الفعلي
      AlertsEventSystem.emit('alerts:changed')
    } catch (error) {
      console.error('Error deleting appointment alerts:', error)
    }
  }

  /**
   * حذف التنبيهات المرتبطة بدفعة معينة
   */
  static async deletePaymentAlerts(paymentId: string): Promise<void> {
    try {
      console.log('🗑️ Deleting alerts for payment:', paymentId)
      const alerts = await window.electronAPI?.smartAlerts?.getAll?.() || []

      let deletedCount = 0
      for (const alert of alerts) {
        if (alert.type === 'payment' && alert.relatedData?.paymentId === paymentId) {
          try {
            await window.electronAPI?.smartAlerts?.delete?.(alert.id)
            deletedCount++
          } catch (error) {
            console.warn('Error deleting payment alert:', alert.id, error)
          }
        }
      }

      console.log(`🗑️ Deleted ${deletedCount} alerts for payment ${paymentId}`)

      // إرسال حدث التحديث في الوقت الفعلي
      AlertsEventSystem.emit('alerts:changed')
    } catch (error) {
      console.error('Error deleting payment alerts:', error)
    }
  }

  /**
   * تحديث حالة التنبيه مع إشعار في الوقت الفعلي
   */
  static async updateAlert(alertId: string, updates: Partial<SmartAlert>): Promise<void> {
    try {
      await window.electronAPI?.smartAlerts?.update?.(alertId, updates)
      console.log('✅ Alert updated in database:', alertId, updates)

      // إرسال حدث التحديث في الوقت الفعلي
      AlertsEventSystem.emit('alert:updated', { alertId, updates })
      AlertsEventSystem.emit('alerts:changed')

    } catch (error) {
      console.error('Error updating alert:', error)
      throw error
    }
  }

  /**
   * حذف تنبيه مع إشعار في الوقت الفعلي
   */
  static async deleteAlert(alertId: string): Promise<void> {
    try {
      await window.electronAPI?.smartAlerts?.delete?.(alertId)
      console.log('✅ Alert deleted from database:', alertId)

      // إرسال حدث الحذف في الوقت الفعلي
      AlertsEventSystem.emit('alert:deleted', { alertId })
      AlertsEventSystem.emit('alerts:changed')

    } catch (error) {
      console.error('Error deleting alert:', error)
      throw error
    }
  }

  /**
   * الاستماع لأحداث التنبيهات
   */
  static addEventListener(event: string, callback: Function) {
    AlertsEventSystem.addEventListener(event, callback)
  }

  /**
   * إزالة مستمع الأحداث
   */
  static removeEventListener(event: string, callback: Function) {
    AlertsEventSystem.removeEventListener(event, callback)
  }

  /**
   * إرسال حدث تنبيه مخصص
   */
  static emitEvent(event: string, data?: any) {
    AlertsEventSystem.emit(event, data)
  }

  /**
   * تنظيف جميع المستمعين
   */
  static clearAllEventListeners() {
    AlertsEventSystem.removeAllListeners()
  }

  /**
   * توليد تنبيهات المخزون والاحتياجات
   */
  private static async generateInventoryAlerts(): Promise<SmartAlert[]> {
    const alerts: SmartAlert[] = []

    try {
      const inventoryItems = await window.electronAPI?.inventory?.getAll?.() || []
      const today = new Date()

      inventoryItems.forEach((item: any) => {
        // تنبيه للعناصر المنتهية الصلاحية
        if (item.expiry_date) {
          const expiryDate = new Date(item.expiry_date)
          const daysUntilExpiry = Math.floor((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

          if (daysUntilExpiry <= 30 && daysUntilExpiry >= 0) {
            alerts.push({
              id: `inventory_expiry_${item.id}`,
              type: 'inventory',
              priority: daysUntilExpiry <= 7 ? 'high' : 'medium',
              title: `انتهاء صلاحية قريب - ${item.name}`,
              description: `ينتهي في ${daysUntilExpiry} يوم - الكمية: ${item.quantity}`,
              relatedData: {
                inventoryId: item.id
              },
              actionRequired: true,
              dueDate: item.expiry_date,
              createdAt: new Date().toISOString(),
              isRead: false,
              isDismissed: false
            })
          } else if (daysUntilExpiry < 0) {
            alerts.push({
              id: `inventory_expired_${item.id}`,
              type: 'inventory',
              priority: 'high',
              title: `منتهي الصلاحية - ${item.name}`,
              description: `انتهت الصلاحية منذ ${Math.abs(daysUntilExpiry)} يوم - الكمية: ${item.quantity}`,
              relatedData: {
                inventoryId: item.id
              },
              actionRequired: true,
              createdAt: new Date().toISOString(),
              isRead: false,
              isDismissed: false
            })
          }
        }

        // تنبيه للعناصر قليلة المخزون
        if (item.quantity <= (item.min_quantity || 5)) {
          alerts.push({
            id: `inventory_low_${item.id}`,
            type: 'inventory',
            priority: item.quantity === 0 ? 'high' : 'medium',
            title: `مخزون منخفض - ${item.name}`,
            description: `الكمية المتبقية: ${item.quantity} - الحد الأدنى: ${item.min_quantity || 5}`,
            relatedData: {
              inventoryId: item.id,
              currentQuantity: item.quantity,
              minimumQuantity: item.min_quantity || 5
            },
            actionRequired: true,
            createdAt: new Date().toISOString(),
            isRead: false,
            isDismissed: false
          })
        }

        // تنبيه للاستخدام المفرط (إذا كان معدل الاستخدام متوفر)
        if (item.usage_rate && item.usage_rate > 0) {
          const daysUntilEmpty = Math.floor(item.quantity / item.usage_rate)

          // تنبيه إذا كان المخزون سينفد خلال أسبوع
          if (daysUntilEmpty <= 7 && daysUntilEmpty > 0) {
            alerts.push({
              id: `inventory_high_usage_${item.id}`,
              type: 'inventory',
              priority: daysUntilEmpty <= 3 ? 'high' : 'medium',
              title: `استخدام مفرط - ${item.name}`,
              description: `سينفد خلال ${daysUntilEmpty} يوم بمعدل الاستخدام الحالي (${item.usage_rate}/يوم)`,
              relatedData: {
                inventoryId: item.id,
                usageRate: item.usage_rate,
                daysUntilEmpty: daysUntilEmpty,
                currentQuantity: item.quantity
              },
              actionRequired: true,
              createdAt: new Date().toISOString(),
              isRead: false,
              isDismissed: false
            })
          }
        }

        // تنبيه للعناصر غير المستخدمة لفترة طويلة
        if (item.last_used_date) {
          const lastUsedDate = new Date(item.last_used_date)
          const daysSinceLastUse = Math.floor((today.getTime() - lastUsedDate.getTime()) / (1000 * 60 * 60 * 24))

          if (daysSinceLastUse > 90) { // أكثر من 3 أشهر
            alerts.push({
              id: `inventory_unused_${item.id}`,
              type: 'inventory',
              priority: 'low',
              title: `عنصر غير مستخدم - ${item.name}`,
              description: `لم يستخدم منذ ${daysSinceLastUse} يوم - الكمية: ${item.quantity}`,
              relatedData: {
                inventoryId: item.id,
                lastUsedDate: item.last_used_date,
                daysSinceLastUse: daysSinceLastUse,
                currentQuantity: item.quantity
              },
              actionRequired: false,
              createdAt: new Date().toISOString(),
              isRead: false,
              isDismissed: false
            })
          }
        }
      })

    } catch (error) {
      console.error('Error generating inventory alerts:', error)
    }

    return alerts
  }

  /**
   * تنظيف التنبيهات المؤجلة المنتهية الصلاحية
   */
  static async clearExpiredSnoozedAlerts(): Promise<void> {
    try {
      await window.electronAPI?.smartAlerts?.clearExpiredSnoozed?.()
      console.log('✅ Cleared expired snoozed alerts')
    } catch (error) {
      console.error('Error clearing expired snoozed alerts:', error)
    }
  }

  /**
   * تنظيف التنبيهات المخفية
   */
  static async clearDismissedAlerts(): Promise<void> {
    try {
      await window.electronAPI?.smartAlerts?.clearDismissed?.()
      console.log('✅ Cleared dismissed alerts')
    } catch (error) {
      console.error('Error clearing dismissed alerts:', error)
    }
  }

  /**
   * تنظيف التنبيهات القديمة والمنتهية الصلاحية
   */
  private static async cleanupOutdatedAlerts() {
    try {
      console.log('🧹 Cleaning up outdated alerts...')
      const alerts = await window.electronAPI?.smartAlerts?.getAll?.() || []
      const now = new Date()
      const threeDaysAgo = new Date(now.getTime() - (3 * 24 * 60 * 60 * 1000))

      let cleanedCount = 0

      for (const alert of alerts) {
        let shouldDelete = false

        // حذف التنبيهات المرفوضة القديمة (أكثر من 3 أيام)
        if (alert.isDismissed && new Date(alert.createdAt) < threeDaysAgo) {
          shouldDelete = true
        }

        // حذف تنبيهات المواعيد للمواعيد المكتملة أو الملغاة
        if (alert.type === 'appointment' && alert.relatedData?.appointmentId) {
          try {
            const appointments = await window.electronAPI?.appointments?.getAll?.() || []
            const relatedAppointment = appointments.find(a => a.id === alert.relatedData?.appointmentId)

            if (relatedAppointment && (relatedAppointment.status === 'completed' || relatedAppointment.status === 'cancelled')) {
              shouldDelete = true
            }

            // حذف تنبيهات المواعيد القديمة (أكثر من أسبوع من تاريخ الموعد)
            if (relatedAppointment && relatedAppointment.start_time) {
              const appointmentDate = new Date(relatedAppointment.start_time)
              const oneWeekAfterAppointment = new Date(appointmentDate.getTime() + (7 * 24 * 60 * 60 * 1000))
              if (now > oneWeekAfterAppointment) {
                shouldDelete = true
              }
            }
          } catch (error) {
            console.warn('Error checking appointment for alert cleanup:', error)
          }
        }

        // حذف تنبيهات الدفعات للدفعات المكتملة
        if (alert.type === 'payment' && alert.relatedData?.paymentId) {
          try {
            const payments = await window.electronAPI?.payments?.getAll?.() || []
            const relatedPayment = payments.find(p => p.id === alert.relatedData?.paymentId)

            if (relatedPayment && (relatedPayment.status === 'completed' || relatedPayment.remaining_balance <= 0)) {
              shouldDelete = true
            }
          } catch (error) {
            console.warn('Error checking payment for alert cleanup:', error)
          }
        }

        if (shouldDelete) {
          try {
            await window.electronAPI?.smartAlerts?.delete?.(alert.id)
            cleanedCount++
          } catch (error) {
            console.warn('Error deleting outdated alert:', alert.id, error)
          }
        }
      }

      console.log(`🧹 Cleaned up ${cleanedCount} outdated alerts`)
    } catch (error) {
      console.error('Error during alert cleanup:', error)
    }
  }

  /**
   * إزالة التنبيهات المكررة بطريقة أكثر ذكاءً
   */
  private static removeDuplicateAlerts(alerts: SmartAlert[]): SmartAlert[] {
    const seen = new Map<string, SmartAlert>()
    const contentBasedSeen = new Map<string, SmartAlert>()

    alerts.forEach(alert => {
      // فحص التكرار بناءً على المعرف
      const existingAlert = seen.get(alert.id)

      if (!existingAlert) {
        // فحص التكرار بناءً على المحتوى
        const contentKey = this.generateContentKey(alert)
        const existingContentAlert = contentBasedSeen.get(contentKey)

        if (!existingContentAlert) {
          // تنبيه جديد تماماً
          seen.set(alert.id, alert)
          contentBasedSeen.set(contentKey, alert)
        } else {
          // تنبيه مكرر بناءً على المحتوى - احتفظ بالأحدث
          const existingDate = new Date(existingContentAlert.createdAt).getTime()
          const newDate = new Date(alert.createdAt).getTime()

          if (newDate > existingDate || this.isAlertMoreComplete(alert, existingContentAlert)) {
            // استبدل التنبيه القديم بالجديد
            seen.delete(existingContentAlert.id)
            seen.set(alert.id, alert)
            contentBasedSeen.set(contentKey, alert)
          }
        }
      } else {
        // تنبيه موجود بنفس المعرف - احتفظ بالأحدث أو الأكثر اكتمالاً
        if (this.isAlertMoreComplete(alert, existingAlert)) {
          seen.set(alert.id, alert)
          const contentKey = this.generateContentKey(alert)
          contentBasedSeen.set(contentKey, alert)
        }
      }
    })

    return Array.from(seen.values())
  }

  /**
   * توليد مفتاح فريد بناءً على محتوى التنبيه
   */
  private static generateContentKey(alert: SmartAlert): string {
    const keyParts = [
      alert.type,
      alert.patientId || 'no-patient',
      alert.title.replace(/\s+/g, '').toLowerCase(),
      alert.relatedData ? JSON.stringify(alert.relatedData) : 'no-data'
    ]
    return keyParts.join('|')
  }

  /**
   * فحص ما إذا كان التنبيه أكثر اكتمالاً من آخر
   */
  private static isAlertMoreComplete(alert1: SmartAlert, alert2: SmartAlert): boolean {
    const alert1Date = new Date(alert1.createdAt).getTime()
    const alert2Date = new Date(alert2.createdAt).getTime()

    // الأحدث زمنياً
    if (alert1Date > alert2Date) return true
    if (alert1Date < alert2Date) return false

    // نفس التاريخ - فحص اكتمال البيانات
    const alert1Score = this.calculateCompletenessScore(alert1)
    const alert2Score = this.calculateCompletenessScore(alert2)

    return alert1Score > alert2Score
  }

  /**
   * حساب درجة اكتمال التنبيه
   */
  private static calculateCompletenessScore(alert: SmartAlert): number {
    let score = 0

    if (alert.patientId) score += 2
    if (alert.patientName) score += 1
    if (alert.relatedData && Object.keys(alert.relatedData).length > 0) score += 3
    if (alert.dueDate) score += 1
    if (alert.actionRequired) score += 1
    if (alert.isRead !== undefined) score += 1
    if (alert.isDismissed !== undefined) score += 1

    return score
  }

  /**
   * ترتيب التنبيهات حسب الأولوية والتاريخ
   */
  private static sortAlertsByPriority(alerts: SmartAlert[]): SmartAlert[] {
    const priorityOrder = { 'high': 1, 'medium': 2, 'low': 3 }

    return alerts.sort((a, b) => {
      // ترتيب حسب الأولوية أولاً
      const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority]
      if (priorityDiff !== 0) return priorityDiff

      // ثم حسب التاريخ (الأحدث أولاً)
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    })
  }

  // Helper methods
  private static isSameDay(date1: Date, date2: Date): boolean {
    return date1.getFullYear() === date2.getFullYear() &&
           date1.getMonth() === date2.getMonth() &&
           date1.getDate() === date2.getDate()
  }

  /**
   * توليد تنبيهات المختبرات
   */
  private static async generateLabOrderAlerts(): Promise<SmartAlert[]> {
    const alerts: SmartAlert[] = []

    try {
      const labOrders = await window.electronAPI?.labOrders?.getAll?.() || []
      const today = new Date()

      labOrders.forEach((order: any) => {
        // تنبيه للطلبات المتأخرة في التسليم
        if (order.expected_delivery_date && order.status === 'معلق') {
          const expectedDate = new Date(order.expected_delivery_date)
          const daysLate = Math.floor((today.getTime() - expectedDate.getTime()) / (1000 * 60 * 60 * 24))

          if (daysLate > 0) {
            alerts.push({
              id: `lab_order_overdue_${order.id}`,
              type: 'lab_order',
              priority: daysLate > 7 ? 'high' : 'medium',
              title: `طلب مختبر متأخر - ${order.service_name}`,
              description: `متأخر ${daysLate} يوم عن الموعد المتوقع${order.patient?.full_name ? ` - ${order.patient.full_name}` : ''}`,
              patientId: order.patient_id,
              patientName: order.patient?.full_name,
              relatedData: {
                labOrderId: order.id,
                labId: order.lab_id,
                expectedDate: order.expected_delivery_date
              },
              actionRequired: true,
              dueDate: order.expected_delivery_date,
              createdAt: new Date().toISOString(),
              isRead: false,
              isDismissed: false
            })
          }
        }

        // تنبيه للدفعات المعلقة
        if (order.remaining_balance > 0) {
          alerts.push({
            id: `lab_order_payment_${order.id}`,
            type: 'payment',
            priority: 'medium',
            title: `دفعة مختبر معلقة - ${order.service_name}`,
            description: `المبلغ المتبقي: $${order.remaining_balance}${order.patient?.full_name ? ` - ${order.patient.full_name}` : ''}`,
            patientId: order.patient_id,
            patientName: order.patient?.full_name,
            relatedData: {
              labOrderId: order.id,
              labId: order.lab_id,
              remainingBalance: order.remaining_balance
            },
            actionRequired: true,
            createdAt: new Date().toISOString(),
            isRead: false,
            isDismissed: false
          })
        }

        // تنبيه للطلبات القريبة من موعد التسليم
        if (order.expected_delivery_date && order.status === 'معلق') {
          const expectedDate = new Date(order.expected_delivery_date)
          const daysUntilDelivery = Math.floor((expectedDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

          if (daysUntilDelivery <= 2 && daysUntilDelivery >= 0) {
            alerts.push({
              id: `lab_order_due_soon_${order.id}`,
              type: 'lab_order',
              priority: 'low',
              title: `طلب مختبر قريب التسليم - ${order.service_name}`,
              description: `متوقع التسليم خلال ${daysUntilDelivery} يوم${order.patient?.full_name ? ` - ${order.patient.full_name}` : ''}`,
              patientId: order.patient_id,
              patientName: order.patient?.full_name,
              relatedData: {
                labOrderId: order.id,
                labId: order.lab_id,
                expectedDate: order.expected_delivery_date
              },
              actionRequired: false,
              dueDate: order.expected_delivery_date,
              createdAt: new Date().toISOString(),
              isRead: false,
              isDismissed: false
            })
          }
        }
      })

    } catch (error) {
      console.error('Error generating lab order alerts:', error)
    }

    return alerts
  }

  /**
   * توليد تنبيهات احتياجات العيادة
   */
  private static async generateClinicNeedsAlerts(): Promise<SmartAlert[]> {
    const alerts: SmartAlert[] = []

    try {
      const clinicNeeds = await window.electronAPI?.clinicNeeds?.getAll?.() || []
      const today = new Date()

      clinicNeeds.forEach((need: any) => {
        // تنبيه للاحتياجات عالية الأولوية المعلقة
        if (need.priority === 'urgent' && need.status === 'pending') {
          const createdDate = new Date(need.created_at)
          const daysPending = Math.floor((today.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24))

          alerts.push({
            id: `clinic_need_urgent_${need.id}`,
            type: 'inventory',
            priority: 'high',
            title: `احتياج عاجل معلق - ${need.need_name}`,
            description: `معلق منذ ${daysPending} يوم - الكمية: ${need.quantity}`,
            relatedData: {
              clinicNeedId: need.id,
              needName: need.need_name,
              quantity: need.quantity,
              priority: need.priority
            },
            actionRequired: true,
            createdAt: new Date().toISOString(),
            isRead: false,
            isDismissed: false
          })
        }

        // تنبيه للاحتياجات المطلوبة لفترة طويلة
        if (need.status === 'ordered') {
          const createdDate = new Date(need.created_at)
          const daysOrdered = Math.floor((today.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24))

          if (daysOrdered > 14) { // أكثر من أسبوعين
            alerts.push({
              id: `clinic_need_delayed_${need.id}`,
              type: 'inventory',
              priority: need.priority === 'urgent' ? 'high' : 'medium',
              title: `احتياج متأخر - ${need.need_name}`,
              description: `مطلوب منذ ${daysOrdered} يوم - الكمية: ${need.quantity}`,
              relatedData: {
                clinicNeedId: need.id,
                needName: need.need_name,
                quantity: need.quantity,
                supplier: need.supplier
              },
              actionRequired: true,
              createdAt: new Date().toISOString(),
              isRead: false,
              isDismissed: false
            })
          }
        }

        // تنبيه للاحتياجات عالية التكلفة المعلقة
        if (need.price > 1000 && need.status === 'pending') {
          alerts.push({
            id: `clinic_need_expensive_${need.id}`,
            type: 'inventory',
            priority: 'medium',
            title: `احتياج عالي التكلفة - ${need.need_name}`,
            description: `التكلفة: $${need.price} - يحتاج موافقة`,
            relatedData: {
              clinicNeedId: need.id,
              needName: need.need_name,
              price: need.price,
              quantity: need.quantity
            },
            actionRequired: true,
            createdAt: new Date().toISOString(),
            isRead: false,
            isDismissed: false
          })
        }
      })

    } catch (error) {
      console.error('Error generating clinic needs alerts:', error)
    }

    return alerts
  }

  private static formatTime(dateString: string): string {
    try {
      if (!dateString) {
        return '--'
      }

      const date = new Date(dateString)

      // Check if date is valid
      if (isNaN(date.getTime())) {
        return '--'
      }

      return date.toLocaleTimeString('ar-EG', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      })
    } catch (error) {
      console.error('Error formatting time:', error)
      return '--'
    }
  }
}
