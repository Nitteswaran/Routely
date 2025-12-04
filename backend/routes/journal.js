import express from 'express'
import {
  createJournalEntry,
  getJournalEntries,
  getJournalEntry,
  deleteJournalEntry,
} from '../controllers/journalController.js'
import { protect } from '../middleware/auth.js'

const router = express.Router()

// All journal routes require authentication
router.use(protect)

router.post('/', createJournalEntry)
router.get('/', getJournalEntries)
router.get('/:id', getJournalEntry)
router.delete('/:id', deleteJournalEntry)

export default router

