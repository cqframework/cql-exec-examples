// NOTE:  This is a simplified example, designed only for the purpose of demonstrating how to
// use the cql-execution, cql-exec-fhir, and cql-exec-vsac javascript modules.  This CQL
// checks to see if a patient matches certain criteria and is intended to be used for things
// such as filtering a large set of synthetic patients to patients of interest.

library PatientFinderExample version '1.0.0'
using FHIR version '4.0.1'
include FHIRHelpers version '4.0.1' called FHIRHelpers

codesystem "CONDITION-VER-STATUS": 'http://terminology.hl7.org/CodeSystem/condition-ver-status'
codesystem "CONDITION-CLINICAL": 'http://terminology.hl7.org/CodeSystem/condition-clinical'
// [See value set in VSAC](https://vsac.nlm.nih.gov/valueset/2.16.840.1.113762.1.4.1032.37/expansion)
valueset "Conditions associated with chronic pain": 'https://cts.nlm.nih.gov/fhir/ValueSet/2.16.840.1.113762.1.4.1032.37'
code "Confirmed code": 'confirmed' from "CONDITION-VER-STATUS" display 'Confirmed'
code "Active code": 'active' from "CONDITION-CLINICAL" display 'Active'
code "Relapse code": 'relapse' from "CONDITION-CLINICAL" display 'Relapse'
concept "Confirmed": { "Confirmed code" } display 'Confirmed'
concept "Active": { "Active code" } display 'Active'
concept "Relapse": { "Relapse code" } display 'Relapse'

context Patient

define Is18OrOlder:
  AgeInYears() >= 18

define HasConditionAssociatedWithChronicPain:
  exists(
    [Condition: "Conditions associated with chronic pain"] C
      where C.verificationStatus ~ "Confirmed"
      and (C.clinicalStatus ~ "Active" or C.clinicalStatus ~ "Relapse")
  )

define IsMatch:
  Is18OrOlder and HasConditionAssociatedWithChronicPain

define MatchData: Tuple{ ID: Patient.id.value, IsMatch: IsMatch }

context Unfiltered

define MatchedIDs: MatchData D where D.IsMatch return D.ID