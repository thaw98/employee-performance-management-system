import nrcJson from '../../../assets/nrc.json'

interface RawNrcEntry {
  id: string
  name_en: string
  name_mm: string
  nrc_code: string
}

interface RawNrcData {
  data: RawNrcEntry[]
}

interface NrcName {
  en: string
}

export interface NrcState {
  id: number
  number: NrcName
  name: NrcName
}

export interface NrcTownship {
  id: number
  stateCode: string
  short: NrcName
  name: NrcName
}

export interface NrcType {
  id: string
  name: NrcName
}

const rawData = nrcJson as RawNrcData
const rawTownships = rawData.data ?? []

const stateCodes = Array.from(new Set(rawTownships.map((entry) => entry.nrc_code))).sort(
  (a, b) => Number(a) - Number(b),
)

const states: NrcState[] = stateCodes.map((code) => ({
  id: Number(code),
  number: { en: code },
  // Source data does not include state names, so we display the code.
  name: { en: code },
}))

const townships: NrcTownship[] = rawTownships.map((entry) => ({
  id: Number(entry.id),
  stateCode: entry.nrc_code,
  short: { en: entry.name_en },
  name: { en: entry.name_mm },
}))

const types: NrcType[] = [
  { id: 'N', name: { en: 'N' } },
  { id: 'E', name: { en: 'E' } },
  { id: 'P', name: { en: 'P' } },
]

export function getNrcStates(): NrcState[] {
  return states
}

export function getNrcTownships(): NrcTownship[] {
  return townships
}

export function getNrcTypes(): NrcType[] {
  return types
}
