export interface Supervisor {
  id: string
  name: string
  email: string
  active: boolean
}

export interface Squad {
  id: string
  name: string
  supervisorId: string
  active: boolean
}

export interface AssignmentSnapshot {
  squadId: string
  squadName: string
  supervisorId: string
  supervisorName: string
}
