type LabelTranslator = (key: string) => string

const authorityClassLabelKeyMap: Record<string, string> = {
  state: 'authorityClass.state',
  state_integrated: 'authorityClass.state_integrated',
  private: 'authorityClass.private',
  charter: 'authorityClass.charter',
  other: 'authorityClass.other',
}

const coEdStatusLabelKeyMap: Record<string, string> = {
  'Co-Educational': 'coEdStatus.co_educational',
  'Girls School': 'coEdStatus.girls_school',
  'Boys School': 'coEdStatus.boys_school',
  'Primary Co-Ed/Secondary Girls': 'coEdStatus.primary_coed_secondary_girls',
  'Primary Co-Ed/Secondary Boys': 'coEdStatus.primary_coed_secondary_boys',
  'Boys/Senior Co-Ed': 'coEdStatus.boys_senior_coed',
  Girls: 'coEdStatus.girls',
  Boys: 'coEdStatus.boys',
  'Not Applicable': 'coEdStatus.not_applicable',
}

const orgTypeLabelKeyMap: Record<string, string> = {
  'Full Primary': 'orgType.full_primary',
  Contributing: 'orgType.contributing',
  'Secondary (Year 9-15)': 'orgType.secondary_9_15',
  Composite: 'orgType.composite',
  'Secondary (Year 7-15)': 'orgType.secondary_7_15',
  Intermediate: 'orgType.intermediate',
  'Specialist School': 'orgType.specialist_school',
  'Teen Parent Unit': 'orgType.teen_parent_unit',
  'Activity Centre': 'orgType.activity_centre',
  'Composite (Year 1-10)': 'orgType.composite_1_10',
  'Restricted Composite (Year 7-10)': 'orgType.restricted_composite_7_10',
  'Secondary (Year 7-10)': 'orgType.secondary_7_10',
  'Secondary (Year 11-15)': 'orgType.secondary_11_15',
  'Correspondence School': 'orgType.correspondence_school',
}

const regionLabelKeyMap: Record<string, string> = {
  'Bay of Plenty, Waiariki': 'region.bay_of_plenty_waiariki',
  'Canterbury, Chatham Islands': 'region.canterbury_chatham_islands',
  "Hawke's Bay, Tairāwhiti": 'region.hawkes_bay_tairawhiti',
  'Nelson, Marlborough, West Coast': 'region.nelson_marlborough_west_coast',
  'Otago, Southland': 'region.otago_southland',
  'Tai Tokerau': 'region.tai_tokerau',
  'Taranaki, Whanganui, Manawatū': 'region.taranaki_whanganui_manawatu',
  'Tāmaki Herenga Manawa': 'region.tamaki_herenga_manawa',
  'Tāmaki Herenga Tāngata': 'region.tamaki_herenga_tangata',
  'Tāmaki Herenga Waka': 'region.tamaki_herenga_waka',
  Waikato: 'region.waikato',
  Wellington: 'region.wellington',
}

function translateWithMap(
  value: string | null | undefined,
  keyMap: Record<string, string>,
  tEnum: LabelTranslator
) {
  if (!value) return '-'
  const key = keyMap[value]
  return key ? tEnum(key) : value
}

export function createNzSchoolEnumLabelHelpers(tEnum: LabelTranslator) {
  return {
    getRegionLabel: (value?: string | null) => translateWithMap(value, regionLabelKeyMap, tEnum),
    getAuthorityClassLabel: (value?: string | null) =>
      translateWithMap(value, authorityClassLabelKeyMap, tEnum),
    getCoEdStatusLabel: (value?: string | null) =>
      translateWithMap(value, coEdStatusLabelKeyMap, tEnum),
    getOrgTypeLabel: (value?: string | null) => translateWithMap(value, orgTypeLabelKeyMap, tEnum),
  }
}
