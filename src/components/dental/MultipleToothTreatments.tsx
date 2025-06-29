import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useTheme } from '@/contexts/ThemeContext'
import { cn } from '@/lib/utils'
import {
  Plus,
  Edit,
  Trash2,
  Save,
  X,
  Calendar,
  DollarSign,
  Clock,
  ArrowUp,
  ArrowDown,
  CheckCircle,
  AlertCircle,
  PlayCircle,
  XCircle
} from 'lucide-react'
import { ToothTreatment } from '@/types'
import {
  TREATMENT_TYPES,
  TREATMENT_CATEGORIES,
  TREATMENT_STATUS_OPTIONS,
  getTreatmentsByCategory,
  getTreatmentByValue,
  getCategoryInfo
} from '@/data/teethData'
import { formatDate } from '@/lib/utils'
import { notify } from '@/services/notificationService'

interface MultipleToothTreatmentsProps {
  patientId: string
  toothNumber: number
  toothName: string
  treatments: ToothTreatment[]
  onAddTreatment: (treatment: Omit<ToothTreatment, 'id' | 'created_at' | 'updated_at'>) => Promise<void>
  onUpdateTreatment: (id: string, updates: Partial<ToothTreatment>) => Promise<void>
  onDeleteTreatment: (id: string) => Promise<void>
  onReorderTreatments: (treatmentIds: string[]) => Promise<void>
}

export default function MultipleToothTreatments({
  patientId,
  toothNumber,
  toothName,
  treatments,
  onAddTreatment,
  onUpdateTreatment,
  onDeleteTreatment,
  onReorderTreatments
}: MultipleToothTreatmentsProps) {
  const { isDarkMode } = useTheme()
  const [isAddingTreatment, setIsAddingTreatment] = useState(false)
  const [editingTreatment, setEditingTreatment] = useState<string | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<string>('')
  const [newTreatment, setNewTreatment] = useState<Partial<ToothTreatment>>({
    patient_id: patientId,
    tooth_number: toothNumber,
    tooth_name: toothName,
    treatment_status: 'planned',
    cost: 0,
    priority: treatments.length + 1
  })

  // Sort treatments by priority
  const sortedTreatments = [...treatments].sort((a, b) => a.priority - b.priority)

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'planned': return <Clock className="w-4 h-4 text-blue-500" />
      case 'in_progress': return <PlayCircle className="w-4 h-4 text-yellow-500" />
      case 'completed': return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'cancelled': return <XCircle className="w-4 h-4 text-gray-500" />
      default: return <AlertCircle className="w-4 h-4 text-gray-400" />
    }
  }

  const getStatusColor = (status: string) => {
    const statusOption = TREATMENT_STATUS_OPTIONS.find(s => s.value === status)
    return statusOption?.color || '#6b7280'
  }

  const handleAddTreatment = async () => {
    if (!newTreatment.treatment_type || !newTreatment.treatment_category) {
      notify.error('يرجى اختيار نوع العلاج والتصنيف')
      return
    }

    try {
      const treatmentData = {
        ...newTreatment,
        treatment_color: getTreatmentByValue(newTreatment.treatment_type!)?.color || '#22c55e'
      } as Omit<ToothTreatment, 'id' | 'created_at' | 'updated_at'>

      await onAddTreatment(treatmentData)

      // Reset form
      setNewTreatment({
        patient_id: patientId,
        tooth_number: toothNumber,
        tooth_name: toothName,
        treatment_status: 'planned',
        cost: 0,
        priority: treatments.length + 2
      })
      setSelectedCategory('')
      setIsAddingTreatment(false)
      notify.success('تم إضافة العلاج بنجاح')
    } catch (error) {
      notify.error('فشل في إضافة العلاج')
    }
  }

  const handleUpdateTreatment = async (id: string, updates: Partial<ToothTreatment>) => {
    try {
      await onUpdateTreatment(id, updates)
      setEditingTreatment(null)
      notify.success('تم تحديث العلاج بنجاح')
    } catch (error) {
      notify.error('فشل في تحديث العلاج')
    }
  }

  const handleDeleteTreatment = async (id: string) => {
    if (window.confirm('هل أنت متأكد من حذف هذا العلاج؟')) {
      try {
        await onDeleteTreatment(id)
        notify.success('تم حذف العلاج بنجاح')
      } catch (error) {
        notify.error('فشل في حذف العلاج')
      }
    }
  }

  const moveTreatmentUp = async (index: number) => {
    if (index === 0) return

    const newOrder = [...sortedTreatments]
    const temp = newOrder[index]
    newOrder[index] = newOrder[index - 1]
    newOrder[index - 1] = temp

    const treatmentIds = newOrder.map(t => t.id)
    await onReorderTreatments(treatmentIds)
  }

  const moveTreatmentDown = async (index: number) => {
    if (index === sortedTreatments.length - 1) return

    const newOrder = [...sortedTreatments]
    const temp = newOrder[index]
    newOrder[index] = newOrder[index + 1]
    newOrder[index + 1] = temp

    const treatmentIds = newOrder.map(t => t.id)
    await onReorderTreatments(treatmentIds)
  }

  const filteredTreatmentTypes = selectedCategory
    ? getTreatmentsByCategory(selectedCategory as any)
    : TREATMENT_TYPES

  return (
    <div className="space-y-4" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">علاجات السن رقم {toothNumber}</h3>
          <p className="text-sm text-muted-foreground">{toothName}</p>
        </div>
        <Button
          onClick={() => setIsAddingTreatment(true)}
          className="bg-blue-600 hover:bg-blue-700"
          size="sm"
        >
          <Plus className="w-4 h-4 ml-2" />
          إضافة علاج
        </Button>
      </div>

      {/* Existing Treatments */}
      <div className="space-y-3">
        {sortedTreatments.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center">
              <p className="text-muted-foreground">لا توجد علاجات مسجلة لهذا السن</p>
            </CardContent>
          </Card>
        ) : (
          sortedTreatments.map((treatment, index) => (
            <Card key={treatment.id} className="relative">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-muted-foreground">
                        #{treatment.priority}
                      </span>
                      <div className="flex flex-col gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => moveTreatmentUp(index)}
                          disabled={index === 0}
                          className="h-6 w-6 p-0"
                        >
                          <ArrowUp className="w-3 h-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => moveTreatmentDown(index)}
                          disabled={index === sortedTreatments.length - 1}
                          className="h-6 w-6 p-0"
                        >
                          <ArrowDown className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>

                    <div
                      className="w-4 h-4 rounded-full border-2 border-white"
                      style={{ backgroundColor: treatment.treatment_color }}
                    />

                    <div>
                      <CardTitle className="text-base">
                        {getTreatmentByValue(treatment.treatment_type)?.label || treatment.treatment_type}
                      </CardTitle>
                      <CardDescription>
                        {getCategoryInfo(treatment.treatment_category as any)?.label}
                      </CardDescription>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Badge
                      variant="secondary"
                      style={{
                        backgroundColor: getStatusColor(treatment.treatment_status) + '20',
                        color: getStatusColor(treatment.treatment_status)
                      }}
                    >
                      {getStatusIcon(treatment.treatment_status)}
                      <span className="mr-1">
                        {TREATMENT_STATUS_OPTIONS.find(s => s.value === treatment.treatment_status)?.label}
                      </span>
                    </Badge>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setEditingTreatment(treatment.id)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteTreatment(treatment.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="pt-0">
                <div className="grid grid-cols-3 gap-4 text-sm">
                  {treatment.cost && (
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-muted-foreground" />
                      <span>${treatment.cost}</span>
                    </div>
                  )}

                  {treatment.start_date && (
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                      <span>{formatDate(treatment.start_date)}</span>
                    </div>
                  )}

                  {treatment.completion_date && (
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span>{formatDate(treatment.completion_date)}</span>
                    </div>
                  )}
                </div>

                {treatment.notes && (
                  <p className="text-sm text-muted-foreground mt-2 p-2 bg-muted rounded">
                    {treatment.notes}
                  </p>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Edit Treatment Form */}
      {editingTreatment && (
        <Card className={cn(
          "border-2 shadow-lg",
          isDarkMode
            ? "border-orange-800/50 bg-orange-950/20 shadow-orange-900/20"
            : "border-orange-200 bg-orange-50/50 shadow-orange-100/50"
        )}>
          <CardHeader className={cn(
            "border-b",
            isDarkMode ? "border-orange-800/30" : "border-orange-200/50"
          )}>
            <CardTitle className={cn(
              "text-lg",
              isDarkMode ? "text-orange-200" : "text-orange-900"
            )}>تعديل العلاج</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {(() => {
              const treatment = treatments.find(t => t.id === editingTreatment)
              if (!treatment) return null

              return (
                <EditTreatmentFormContent
                  treatment={treatment}
                  onSave={handleUpdateTreatment}
                  onCancel={() => setEditingTreatment(null)}
                />
              )
            })()}
          </CardContent>
        </Card>
      )}

      {/* Add Treatment Form */}
      {isAddingTreatment && (
        <Card className={cn(
          "border-2 shadow-lg",
          isDarkMode
            ? "border-blue-800/50 bg-blue-950/20 shadow-blue-900/20"
            : "border-blue-200 bg-blue-50/50 shadow-blue-100/50"
        )}>
          <CardHeader className={cn(
            "border-b",
            isDarkMode ? "border-blue-800/30" : "border-blue-200/50"
          )}>
            <CardTitle className={cn(
              "text-lg",
              isDarkMode ? "text-blue-200" : "text-blue-900"
            )}>إضافة علاج جديد</CardTitle>
          </CardHeader>
          <CardContent className={cn(
            "space-y-4 p-6",
            isDarkMode ? "bg-blue-950/10" : "bg-blue-50/30"
          )}>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className={cn(
                  "font-medium",
                  isDarkMode ? "text-blue-200" : "text-blue-800"
                )}>تصنيف العلاج</Label>
                <Select
                  value={selectedCategory}
                  onValueChange={(value) => {
                    setSelectedCategory(value)
                    setNewTreatment(prev => ({ ...prev, treatment_category: value }))
                  }}
                >
                  <SelectTrigger className={cn(
                    "border-2 transition-colors",
                    isDarkMode
                      ? "border-blue-800/50 bg-blue-950/30 hover:border-blue-700 focus:border-blue-600"
                      : "border-blue-200 bg-white hover:border-blue-300 focus:border-blue-500"
                  )}>
                    <SelectValue placeholder="اختر التصنيف" />
                  </SelectTrigger>
                  <SelectContent>
                    {TREATMENT_CATEGORIES.map((category) => (
                      <SelectItem key={category.value} value={category.value}>
                        <div className="flex items-center gap-2">
                          <span>{category.icon}</span>
                          <span>{category.label}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className={cn(
                  "font-medium",
                  isDarkMode ? "text-blue-200" : "text-blue-800"
                )}>نوع العلاج</Label>
                <Select
                  value={newTreatment.treatment_type || ''}
                  onValueChange={(value) => setNewTreatment(prev => ({ ...prev, treatment_type: value }))}
                  disabled={!selectedCategory}
                >
                  <SelectTrigger className={cn(
                    "border-2 transition-colors",
                    !selectedCategory && "opacity-50 cursor-not-allowed",
                    isDarkMode
                      ? "border-blue-800/50 bg-blue-950/30 hover:border-blue-700 focus:border-blue-600"
                      : "border-blue-200 bg-white hover:border-blue-300 focus:border-blue-500"
                  )}>
                    <SelectValue placeholder="اختر نوع العلاج" />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredTreatmentTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        <div className="flex items-center gap-2">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: type.color }}
                          />
                          <span>{type.label}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label className={cn(
                  "font-medium",
                  isDarkMode ? "text-blue-200" : "text-blue-800"
                )}>حالة العلاج</Label>
                <Select
                  value={newTreatment.treatment_status || 'planned'}
                  onValueChange={(value) => setNewTreatment(prev => ({ ...prev, treatment_status: value as any }))}
                >
                  <SelectTrigger className={cn(
                    "border-2 transition-colors",
                    isDarkMode
                      ? "border-blue-800/50 bg-blue-950/30 hover:border-blue-700 focus:border-blue-600"
                      : "border-blue-200 bg-white hover:border-blue-300 focus:border-blue-500"
                  )}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TREATMENT_STATUS_OPTIONS.map((status) => (
                      <SelectItem key={status.value} value={status.value}>
                        {status.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className={cn(
                  "font-medium",
                  isDarkMode ? "text-blue-200" : "text-blue-800"
                )}>التكلفة ($)</Label>
                <Input
                  type="number"
                  value={newTreatment.cost || ''}
                  onChange={(e) => setNewTreatment(prev => ({ ...prev, cost: parseFloat(e.target.value) || 0 }))}
                  placeholder="0"
                  className={cn(
                    "border-2 transition-colors",
                    isDarkMode
                      ? "border-blue-800/50 bg-blue-950/30 hover:border-blue-700 focus:border-blue-600"
                      : "border-blue-200 bg-white hover:border-blue-300 focus:border-blue-500"
                  )}
                />
              </div>

              <div className="space-y-2">
                <Label className={cn(
                  "font-medium",
                  isDarkMode ? "text-blue-200" : "text-blue-800"
                )}>تاريخ البدء</Label>
                <Input
                  type="date"
                  value={newTreatment.start_date || ''}
                  onChange={(e) => setNewTreatment(prev => ({ ...prev, start_date: e.target.value }))}
                  className={cn(
                    "border-2 transition-colors",
                    isDarkMode
                      ? "border-blue-800/50 bg-blue-950/30 hover:border-blue-700 focus:border-blue-600"
                      : "border-blue-200 bg-white hover:border-blue-300 focus:border-blue-500"
                  )}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className={cn(
                "font-medium",
                isDarkMode ? "text-blue-200" : "text-blue-800"
              )}>ملاحظات</Label>
              <Textarea
                value={newTreatment.notes || ''}
                onChange={(e) => setNewTreatment(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="أدخل أي ملاحظات إضافية..."
                rows={3}
                className={cn(
                  "border-2 transition-colors resize-none",
                  isDarkMode
                    ? "border-blue-800/50 bg-blue-950/30 hover:border-blue-700 focus:border-blue-600"
                    : "border-blue-200 bg-white hover:border-blue-300 focus:border-blue-500"
                )}
              />
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-blue-200/50 dark:border-blue-800/30">
              <Button
                variant="outline"
                onClick={() => {
                  setIsAddingTreatment(false)
                  setSelectedCategory('')
                  setNewTreatment({
                    patient_id: patientId,
                    tooth_number: toothNumber,
                    tooth_name: toothName,
                    treatment_status: 'planned',
                    cost: 0,
                    priority: treatments.length + 1
                  })
                }}
                className={cn(
                  "border-2 transition-all duration-200",
                  isDarkMode
                    ? "border-gray-600 text-gray-300 hover:border-gray-500 hover:bg-gray-800"
                    : "border-gray-300 text-gray-700 hover:border-gray-400 hover:bg-gray-50"
                )}
              >
                <X className="w-4 h-4 ml-2" />
                إلغاء
              </Button>
              <Button
                onClick={handleAddTreatment}
                className={cn(
                  "transition-all duration-200 shadow-lg",
                  isDarkMode
                    ? "bg-blue-600 hover:bg-blue-700 text-white shadow-blue-900/30"
                    : "bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/30"
                )}
              >
                <Save className="w-4 h-4 ml-2" />
                حفظ العلاج
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

// Edit Treatment Form Component
interface EditTreatmentFormProps {
  treatment: ToothTreatment
  onSave: (id: string, updates: Partial<ToothTreatment>) => Promise<void>
  onCancel: () => void
}

function EditTreatmentFormContent({ treatment, onSave, onCancel }: EditTreatmentFormProps) {
  const { isDarkMode } = useTheme()
  const [editData, setEditData] = useState<Partial<ToothTreatment>>({
    treatment_type: treatment.treatment_type,
    treatment_category: treatment.treatment_category,
    treatment_status: treatment.treatment_status,
    cost: treatment.cost,
    start_date: treatment.start_date,
    completion_date: treatment.completion_date,
    notes: treatment.notes
  })
  const [selectedCategory, setSelectedCategory] = useState(treatment.treatment_category || '')

  const filteredTreatmentTypes = selectedCategory
    ? getTreatmentsByCategory(selectedCategory as any)
    : []

  const handleSave = async () => {
    if (!editData.treatment_type) {
      notify.error('يرجى اختيار نوع العلاج')
      return
    }

    try {
      const updatedData = {
        ...editData,
        treatment_color: getTreatmentByValue(editData.treatment_type!)?.color || treatment.treatment_color
      }
      await onSave(treatment.id, updatedData)
    } catch (error) {
      console.error('Error updating treatment:', error)
    }
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>تصنيف العلاج</Label>
          <Select
            value={selectedCategory}
            onValueChange={(value) => {
              setSelectedCategory(value)
              setEditData(prev => ({ ...prev, treatment_category: value }))
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="اختر التصنيف" />
            </SelectTrigger>
            <SelectContent>
              {TREATMENT_CATEGORIES.map((category) => (
                <SelectItem key={category.value} value={category.value}>
                  <div className="flex items-center gap-2">
                    <span>{category.icon}</span>
                    <span>{category.label}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>نوع العلاج</Label>
          <Select
            value={editData.treatment_type || ''}
            onValueChange={(value) => setEditData(prev => ({ ...prev, treatment_type: value }))}
            disabled={!selectedCategory}
          >
            <SelectTrigger>
              <SelectValue placeholder="اختر نوع العلاج" />
            </SelectTrigger>
            <SelectContent>
              {filteredTreatmentTypes.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: type.color }}
                    />
                    <span>{type.label}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label>حالة العلاج</Label>
          <Select
            value={editData.treatment_status || 'planned'}
            onValueChange={(value) => {
              setEditData(prev => ({
                ...prev,
                treatment_status: value as any,
                // Set completion date to today if status is completed and no date is set
                completion_date: value === 'completed' && !prev.completion_date
                  ? new Date().toISOString().split('T')[0]
                  : prev.completion_date
              }))
            }}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TREATMENT_STATUS_OPTIONS.map((status) => (
                <SelectItem key={status.value} value={status.value}>
                  {status.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>التكلفة ($)</Label>
          <Input
            type="number"
            value={editData.cost || ''}
            onChange={(e) => setEditData(prev => ({ ...prev, cost: parseFloat(e.target.value) || 0 }))}
            placeholder="0"
          />
        </div>

        <div className="space-y-2">
          <Label>تاريخ البدء</Label>
          <Input
            type="date"
            value={editData.start_date || ''}
            onChange={(e) => setEditData(prev => ({ ...prev, start_date: e.target.value }))}
          />
        </div>
      </div>

      {editData.treatment_status === 'completed' && (
        <div className="space-y-2">
          <Label>تاريخ الإنجاز</Label>
          <Input
            type="date"
            value={editData.completion_date || ''}
            onChange={(e) => setEditData(prev => ({ ...prev, completion_date: e.target.value }))}
          />
        </div>
      )}

      <div className="space-y-2">
        <Label>ملاحظات</Label>
        <Textarea
          value={editData.notes || ''}
          onChange={(e) => setEditData(prev => ({ ...prev, notes: e.target.value }))}
          placeholder="أدخل أي ملاحظات إضافية..."
          rows={3}
        />
      </div>

      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onCancel}>
          <X className="w-4 h-4 ml-2" />
          إلغاء
        </Button>
        <Button onClick={handleSave} className="bg-orange-600 hover:bg-orange-700">
          <Save className="w-4 h-4 ml-2" />
          حفظ التغييرات
        </Button>
      </div>
    </div>
  )
}
