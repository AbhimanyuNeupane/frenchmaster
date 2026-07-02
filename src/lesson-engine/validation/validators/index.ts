/**
 * Validator barrel. Importing this runs every validator file for its
 * registration side effect. Adding a validating card type means adding its
 * validator file and one import line here — the validation engine never changes.
 */
import "./multipleChoice";
import "./multipleSelect";
import "./trueFalse";
import "./imageChoice";
import "./listening";
import "./fillBlank";
import "./writing";
import "./dragOrder";
import "./matching";
import "./speaking";
import "./quiz";
