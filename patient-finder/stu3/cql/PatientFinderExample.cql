// NOTE:  This is a simplified example, designed only for the purpose of demonstrating how to
// use the cql-execution, cql-exec-fhir, and cql-exec-vsac javascript modules.  This CQL
// checks to see if a patient matches certain criteria and is intended to be used for things
// such as filtering a large set of synthetic patients to patients of interest.

library PatientFinderExample version '1.0.0'
using FHIR version '3.0.0'
include FHIRHelpers version '3.0.0' called FHIRHelpers

// [See value set in VSAC](https://vsac.nlm.nih.gov/valueset/2.16.840.1.113762.1.4.1032.37/expansion)
valueset "Conditions associated with chronic pain": 'https://cts.nlm.nih.gov/fhir/ValueSet/2.16.840.1.113762.1.4.1032.37'

context Patient

define Is18OrOlder:
  AgeInYears() >= 18

define HasConditionAssociatedWithChronicPain:
  exists(
    [Condition: "Conditions associated with chronic pain"] C
      where C.verificationStatus.value = 'confirmed'
      and C.clinicalStatus.value in {'active', 'relapse'}
  )

define IsMatch:
  Is18OrOlder and HasConditionAssociatedWithChronicPain

define MatchData: Tuple{ ID: Patient.id.value, IsMatch: IsMatch }

context Unfiltered

define MatchedIDs: MatchData D where D.IsMatch return D.ID