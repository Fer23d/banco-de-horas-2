import { MAX_ENTRY_MINUTES, MAX_PROJECT_CODE_LENGTH } from '../config/business'
import type { AssignmentSnapshot } from '../features/squads/types'
import type { DisciplineCode, DocumentTypeCode, TimeEntry } from '../features/time-entries/types'
import { isIsoDate } from '../shared/utils/date'

export const LEGACY_V1_TIME_ENTRY_STORAGE_KEY = 'sma:time-entries:v1'
export const LEGACY_V2_TIME_ENTRY_STORAGE_KEY = 'sma:time-entries:v2'

const legacyProjectCodeById: Readonly<Record<string, string>> = {
  'project-alpha-automation': 'ALF-001',
  'project-alpha-electrical': 'ALF-002',
  'project-beta-expansion': 'BET-101',
}

const safeLegacyAssignmentByCollaboratorId: Readonly<Record<string, AssignmentSnapshot>> = {
  'demo-collaborator-001': {
    squadId: 'squad-automation',
    squadName: 'Engenharia de Automação',
    supervisorId: 'supervisor-demo-001',
    supervisorName: 'Jeen Carlos E. Azevedo',
  },
}

type V2TimeEntry = Omit<TimeEntry, 'disciplineCode' | 'documentTypeCode' | 'assignmentSnapshot'> & {
  disciplineCode?: unknown
  documentTypeCode?: unknown
  assignmentSnapshot?: unknown
}

type V1TimeEntry = Omit<V2TimeEntry, 'projectCode'> & { projectId: string }

export type TimeEntryStorageV2 = {
  version: 2
  entriesByCollaborator: Record<string, V2TimeEntry[]>
}

export type TimeEntryStorageV3 = {
  version: 3
  entriesByCollaborator: Record<string, TimeEntry[]>
}

export type TimeEntryMigrationResult = {
  data: TimeEntryStorageV3
  migratedCount: number
  skippedCount: number
}

export type V1TimeEntryMigrationResult = {
  data: TimeEntryStorageV2
  migratedCount: number
  skippedCount: number
}

const disciplineCodes: readonly DisciplineCode[] = ['—', 'A', 'E']
const documentTypeCodes: readonly DocumentTypeCode[] = [
  '—', 'RN', 'GR', 'G', 'FD', 'DE', 'LM', 'DI', 'LC', 'LI', 'ET', 'MC', 'MO', 'MD', 'FG', 'LA', 'ES', 'CF',
]

function isAssignmentSnapshot(value: unknown): value is AssignmentSnapshot {
  if (!value || typeof value !== 'object') return false
  const snapshot = value as Record<string, unknown>
  return typeof snapshot.squadId === 'string'
    && typeof snapshot.squadName === 'string'
    && typeof snapshot.supervisorId === 'string'
    && typeof snapshot.supervisorName === 'string'
}

function isLegacyEntry(value: unknown, collaboratorId: string, projectField: 'projectId' | 'projectCode') {
  if (!value || typeof value !== 'object') return false
  const entry = value as Record<string, unknown>
  return typeof entry.id === 'string'
    && entry.collaboratorId === collaboratorId
    && isIsoDate(String(entry.entryDate))
    && typeof entry.clientId === 'string'
    && typeof entry[projectField] === 'string'
    && Boolean(String(entry[projectField]).trim())
    && String(entry[projectField]).trim().length <= MAX_PROJECT_CODE_LENGTH
    && typeof entry.activityId === 'string'
    && Number.isInteger(entry.durationMinutes)
    && Number(entry.durationMinutes) > 0
    && Number(entry.durationMinutes) <= MAX_ENTRY_MINUTES
    && typeof entry.details === 'string'
    && Boolean(entry.details.trim())
    && (entry.status === 'ACTIVE' || entry.status === 'CANCELLED')
    && Number.isInteger(entry.version)
    && Number(entry.version) > 0
    && typeof entry.createdAt === 'string'
    && typeof entry.updatedAt === 'string'
}

function optionalString(value: unknown) {
  return typeof value === 'string' && value ? value : undefined
}

function migrateV2Entry(entry: V2TimeEntry, collaboratorId: string): TimeEntry | null {
  return normalizeTimeEntry({
    id: entry.id,
    collaboratorId: entry.collaboratorId,
    entryDate: entry.entryDate,
    clientId: entry.clientId,
    projectCode: entry.projectCode.trim(),
    activityId: entry.activityId,
    disciplineCode: disciplineCodes.includes(entry.disciplineCode as DisciplineCode)
      ? entry.disciplineCode as DisciplineCode
      : '—',
    documentTypeCode: documentTypeCodes.includes(entry.documentTypeCode as DocumentTypeCode)
      ? entry.documentTypeCode as DocumentTypeCode
      : '—',
    durationMinutes: entry.durationMinutes,
    details: entry.details.trim(),
    assignmentSnapshot: safeLegacyAssignmentByCollaboratorId[collaboratorId] ?? null,
    status: entry.status,
    version: entry.version,
    createdAt: entry.createdAt,
    updatedAt: entry.updatedAt,
    lastEditReason: optionalString(entry.lastEditReason),
    sourceEntryId: optionalString(entry.sourceEntryId),
    cancelledAt: optionalString(entry.cancelledAt),
    cancelReason: optionalString(entry.cancelReason),
  }, collaboratorId)
}

export function normalizeTimeEntry(value: unknown, collaboratorId: string): TimeEntry | null {
  if (!value || typeof value !== 'object') return null
  const entry = value as Record<string, unknown>
  if (typeof entry.id !== 'string'
    || entry.collaboratorId !== collaboratorId
    || !isIsoDate(String(entry.entryDate))
    || typeof entry.clientId !== 'string'
    || typeof entry.projectCode !== 'string'
    || !entry.projectCode
    || entry.projectCode !== entry.projectCode.trim()
    || entry.projectCode.length > MAX_PROJECT_CODE_LENGTH
    || typeof entry.activityId !== 'string'
    || !disciplineCodes.includes(entry.disciplineCode as DisciplineCode)
    || !documentTypeCodes.includes(entry.documentTypeCode as DocumentTypeCode)
    || !Number.isInteger(entry.durationMinutes)
    || Number(entry.durationMinutes) <= 0
    || Number(entry.durationMinutes) > MAX_ENTRY_MINUTES
    || typeof entry.details !== 'string'
    || !entry.details.trim()
    || (entry.assignmentSnapshot !== null && !isAssignmentSnapshot(entry.assignmentSnapshot))
    || (entry.status !== 'ACTIVE' && entry.status !== 'CANCELLED')
    || !Number.isInteger(entry.version)
    || Number(entry.version) <= 0
    || typeof entry.createdAt !== 'string') return null

  return {
    id: entry.id,
    collaboratorId,
    entryDate: String(entry.entryDate),
    clientId: entry.clientId,
    projectCode: entry.projectCode,
    activityId: entry.activityId,
    disciplineCode: entry.disciplineCode as DisciplineCode,
    documentTypeCode: entry.documentTypeCode as DocumentTypeCode,
    durationMinutes: Number(entry.durationMinutes),
    details: entry.details.trim(),
    assignmentSnapshot: entry.assignmentSnapshot as AssignmentSnapshot | null,
    status: entry.status,
    version: Number(entry.version),
    createdAt: entry.createdAt,
    updatedAt: typeof entry.updatedAt === 'string' ? entry.updatedAt : '',
    lastEditReason: optionalString(entry.lastEditReason),
    sourceEntryId: optionalString(entry.sourceEntryId),
    cancelledAt: optionalString(entry.cancelledAt),
    cancelReason: optionalString(entry.cancelReason),
  }
}

export function migrateV1TimeEntries(raw: string): V1TimeEntryMigrationResult {
  const parsed = JSON.parse(raw) as unknown
  if (!parsed || typeof parsed !== 'object') throw new Error('Estrutura v1 inválida.')
  const candidate = parsed as { version?: unknown; entriesByCollaborator?: unknown }
  if (candidate.version !== 1 || !candidate.entriesByCollaborator || typeof candidate.entriesByCollaborator !== 'object') {
    throw new Error('Versão ou coleção v1 inválida.')
  }

  let migratedCount = 0
  let skippedCount = 0
  const entriesByCollaborator = Object.fromEntries(
    Object.entries(candidate.entriesByCollaborator).map(([collaboratorId, entries]) => {
      if (!Array.isArray(entries)) return [collaboratorId, []]
      const migratedEntries = entries.flatMap((value) => {
        if (!isLegacyEntry(value, collaboratorId, 'projectId')) {
          skippedCount += 1
          return []
        }
        const entry = value as unknown as V1TimeEntry
        const { projectId, ...unchanged } = entry
        const trimmedProjectId = projectId.trim()
        migratedCount += 1
        return [{ ...unchanged, projectCode: legacyProjectCodeById[trimmedProjectId] ?? trimmedProjectId }]
      })
      return [collaboratorId, migratedEntries]
    }),
  )

  return { data: { version: 2, entriesByCollaborator }, migratedCount, skippedCount }
}

export function migrateV2TimeEntries(raw: string): TimeEntryMigrationResult {
  const parsed = JSON.parse(raw) as unknown
  if (!parsed || typeof parsed !== 'object') throw new Error('Estrutura v2 inválida.')
  const candidate = parsed as { version?: unknown; entriesByCollaborator?: unknown }
  if (candidate.version !== 2 || !candidate.entriesByCollaborator || typeof candidate.entriesByCollaborator !== 'object') {
    throw new Error('Versão ou coleção v2 inválida.')
  }

  let migratedCount = 0
  let skippedCount = 0
  const entriesByCollaborator = Object.fromEntries(
    Object.entries(candidate.entriesByCollaborator).map(([collaboratorId, entries]) => {
      if (!Array.isArray(entries)) return [collaboratorId, []]
      const migratedEntries = entries.flatMap((entry) => {
        if (!isLegacyEntry(entry, collaboratorId, 'projectCode')) {
          skippedCount += 1
          return []
        }
        const migrated = migrateV2Entry(entry as V2TimeEntry, collaboratorId)
        if (!migrated) {
          skippedCount += 1
          return []
        }
        migratedCount += 1
        return [migrated]
      })
      return [collaboratorId, migratedEntries]
    }),
  )

  return { data: { version: 3, entriesByCollaborator }, migratedCount, skippedCount }
}
