import { useState } from 'react'
import {
  Box,
  Tabs,
  Tab,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  Stack,
  Chip,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material'
import { Edit, Delete, Star, StarBorder } from '@mui/icons-material'
import toast from 'react-hot-toast'
import {
  useGetFormulasByAreaQuery,
  useCreateFormulaMutation,
  useUpdateFormulaMutation,
  useSetDefaultFormulaMutation,
  useInactivateFormulaMutation,
} from '../api/scoreFormulaApi'
import type { ScoreFormulaDto } from '../api/scoreFormulaApi'
import FormulaBuilderDialog from '../components/FormulaBuilderDialog'

const AREAS = ['SELF_ASSESSMENT', 'FEEDBACK_360', 'APPRAISAL'] as const

const AREA_LABELS: Record<string, string> = {
  SELF_ASSESSMENT: 'Self-Assessment',
  FEEDBACK_360: '360 Feedback',
  APPRAISAL: 'Appraisal',
}

export default function FormulaManagementPage() {
  const [area, setArea] = useState<string>('SELF_ASSESSMENT')
  const { data: formulas = [], isLoading } = useGetFormulasByAreaQuery(area)
  const [createFormula] = useCreateFormulaMutation()
  const [updateFormula] = useUpdateFormulaMutation()
  const [setDefaultFormula] = useSetDefaultFormulaMutation()
  const [inactivateFormula] = useInactivateFormulaMutation()

  const [builderOpen, setBuilderOpen] = useState(false)
  const [editingFormula, setEditingFormula] = useState<ScoreFormulaDto | null>(null)
  const [inactivateDialog, setInactivateDialog] = useState<ScoreFormulaDto | null>(null)
  const [replacementId, setReplacementId] = useState<number | ''>('')

  const activeFormulas = formulas.filter((f) => f.active)
  const defaultFormula = formulas.find((f) => f.isDefault && f.active)

  const handleCreate = () => {
    setEditingFormula(null)
    setBuilderOpen(true)
  }

  const handleEdit = (formula: ScoreFormulaDto) => {
    setEditingFormula(formula)
    setBuilderOpen(true)
  }

  const handleSave = async (data: { name: string; description?: string; definition: string }) => {
    try {
      if (editingFormula) {
        await updateFormula({ id: editingFormula.id, body: data }).unwrap()
        toast.success('Formula updated')
      } else {
        await createFormula({ ...data, area }).unwrap()
        toast.success('Formula created')
      }
      setBuilderOpen(false)
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to save formula')
    }
  }

  const handleSetDefault = async (id: number) => {
    try {
      await setDefaultFormula(id).unwrap()
      toast.success('Default formula updated')
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to set default formula')
    }
  }

  const handleInactivateClick = (formula: ScoreFormulaDto) => {
    setInactivateDialog(formula)
    setReplacementId('')
  }

  const handleInactivateConfirm = async () => {
    if (!inactivateDialog) return
    try {
      await inactivateFormula({
        id: inactivateDialog.id,
        replacementId: replacementId || undefined,
      }).unwrap()
      toast.success('Formula inactivated')
      setInactivateDialog(null)
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to inactivate formula')
    }
  }

  const needsReplacement = inactivateDialog?.isDefault

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" sx={{ mb: 2, fontWeight: 600 }}>
        Score Formula Management
      </Typography>

      <Tabs value={area} onChange={(_, v) => setArea(v)} sx={{ mb: 3 }}>
        {AREAS.map((a) => (
          <Tab key={a} value={a} label={AREA_LABELS[a]} />
        ))}
      </Tabs>

      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
        <Typography variant="body2" color="text.secondary">
          {activeFormulas.length} active formula{activeFormulas.length !== 1 ? 's' : ''}
          {defaultFormula && (
            <span>
              {' · Default: '}
              <Chip label={defaultFormula.name} size="small" color="primary" />
            </span>
          )}
        </Typography>
        <Button variant="contained" onClick={handleCreate}>
          Create Formula
        </Button>
      </Stack>

      <TableContainer component={Paper} variant="outlined">
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Description</TableCell>
              <TableCell align="center">Status</TableCell>
              <TableCell align="center">Default</TableCell>
              <TableCell align="center">Created</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {!isLoading && formulas.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                  No formulas found for {AREA_LABELS[area]}. Click "Create Formula" to add one.
                </TableCell>
              </TableRow>
            )}
            {isLoading && (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                  Loading...
                </TableCell>
              </TableRow>
            )}
            {formulas.map((f) => (
              <TableRow key={f.id} sx={{ opacity: f.active ? 1 : 0.5 }}>
                <TableCell sx={{ fontWeight: f.isDefault ? 600 : 400 }}>{f.name}</TableCell>
                <TableCell sx={{ maxWidth: 250, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {f.description || '-'}
                </TableCell>
                <TableCell align="center">
                  <Chip
                    label={f.active ? 'Active' : 'Inactive'}
                    size="small"
                    color={f.active ? 'success' : 'default'}
                  />
                </TableCell>
                <TableCell align="center">
                  {f.isDefault ? <Star color="warning" /> : <StarBorder color="disabled" />}
                </TableCell>
                <TableCell align="center" sx={{ fontSize: '0.8rem', whiteSpace: 'nowrap' }}>
                  {new Date(f.createdAt).toLocaleDateString()}
                </TableCell>
                <TableCell align="right">
                  <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                    {f.active && !f.isDefault && (
                      <Tooltip title="Set as default">
                        <IconButton size="small" onClick={() => handleSetDefault(f.id)}>
                          <StarBorder fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    )}
                    {f.active && (
                      <Tooltip title="Edit">
                        <IconButton size="small" onClick={() => handleEdit(f)}>
                          <Edit fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    )}
                    {f.active && (
                      <Tooltip title="Inactivate">
                        <IconButton size="small" onClick={() => handleInactivateClick(f)}>
                          <Delete fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    )}
                  </Stack>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <FormulaBuilderDialog
        open={builderOpen}
        onClose={() => setBuilderOpen(false)}
        onSave={handleSave}
        formula={editingFormula}
        area={area}
      />

      <Dialog open={!!inactivateDialog} onClose={() => setInactivateDialog(null)}>
        <DialogTitle>Inactivate Formula</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            {needsReplacement
              ? `"${inactivateDialog?.name}" is the current default formula. Select an active formula from the same area to become the new default before inactivating.`
              : `Are you sure you want to inactivate "${inactivateDialog?.name}"?`}
          </DialogContentText>
          {needsReplacement && (
            <FormControl fullWidth size="small">
              <InputLabel>Replacement Formula</InputLabel>
              <Select
                value={replacementId}
                label="Replacement Formula"
                onChange={(e) => setReplacementId(e.target.value as number)}
              >
                {activeFormulas
                  .filter((f) => f.id !== inactivateDialog?.id)
                  .map((f) => (
                    <MenuItem key={f.id} value={f.id}>
                      {f.name}
                    </MenuItem>
                  ))}
              </Select>
            </FormControl>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setInactivateDialog(null)}>Cancel</Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleInactivateConfirm}
            disabled={needsReplacement && !replacementId}
          >
            Inactivate
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
