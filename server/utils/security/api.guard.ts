import Guard from "~~/server/utils/security/guard/guard.base";
import {GuardCasbin} from "~~/server/utils/security/guard/guard.casbin";

export const apiGuard: Guard = new GuardCasbin();