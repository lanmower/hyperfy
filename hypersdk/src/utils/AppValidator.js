/**
 * AppValidator - Validates app blueprints and entities
 *
 * Re-exports shared validator from hyperfy core.
 * Maintains backward compatibility for SDK consumers.
 */

import { AppValidator as CoreAppValidator } from '../../../src/core/validators/AppValidator.js'

export class AppValidator extends CoreAppValidator {}
