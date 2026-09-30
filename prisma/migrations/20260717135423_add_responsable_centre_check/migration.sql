-- Enforce the domain invariant: every centre manager belongs to a centre.
ALTER TABLE "User"
ADD CONSTRAINT "User_responsable_centre_check"
CHECK (role <> 'RESPONSABLE_CENTRE' OR "centreId" IS NOT NULL);
