-- Run in the Supabase SQL Editor as the database owner for the audited project.
-- Allows the existing read-only audit role to export current sequence values.
-- SELECT alone does not grant nextval/setval, table writes or schema changes.
BEGIN;
SET LOCAL lock_timeout = '2s';
SET LOCAL statement_timeout = '10s';
GRANT SELECT ON SEQUENCE
  public."Category_id_seq",
  public."ContactClick_id_seq",
  public."NewsletterSubscriber_id_seq",
  public."Page_id_seq",
  public."Project_id_seq",
  public."ProjectReaction_id_seq",
  public."ProjectView_id_seq",
  public."Testimonial_id_seq"
TO predicta_audit;
COMMIT;

-- Optional removal after the snapshot rehearsal, using the same sequence list:
-- REVOKE SELECT ON SEQUENCE ... FROM predicta_audit;
