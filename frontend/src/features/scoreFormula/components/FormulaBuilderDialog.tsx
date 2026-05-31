import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Stack,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Box,
} from '@mui/material'
import { defaultExpression } from '../api/scoreFormulaApi'
import type { ScoreFormulaDto } from '../api/scoreFormulaApi'

interface FormulaBuilderDialogProps {
  open: boolean
  onClose: () => void
  onSave: (data: { name: string; description?: string; definition: string }) => Promise<void>
  formula?: ScoreFormulaDto | null
  area: string
}

interface ExpressionNode {
  numeratorSource: string
  denominatorFields: string[]
  scaleFactor: number
}

const INPUT_OPTIONS = [
  { value: 'SUM_RATINGS', label: 'Sum of Ratings' },
  { value: 'NUM_QUESTIONS', label: 'Number of Questions' },
  { value: 'MAX_RATING', label: 'Max Rating' },
]

const FIXED_NUMERATOR = 'SUM_RATINGS'

function parseDefinition(definition: string): ExpressionNode {
  try {
    const parsed = JSON.parse(definition)
    const expr = parsed.expression || parsed
    if (expr.type === 'multiply') {
      const scaleFactor = expr.right?.type === 'literal' ? expr.right.value : 100
      const divideNode = expr.left
      if (divideNode?.type === 'divide') {
        const numeratorSource = divideNode.left?.name || FIXED_NUMERATOR
        const multiplyNode = divideNode.right
        const denominatorFields: string[] = []
        if (multiplyNode?.type === 'multiply') {
          if (multiplyNode.left?.name) denominatorFields.push(multiplyNode.left.name)
          if (multiplyNode.right?.name) denominatorFields.push(multiplyNode.right.name)
        }
        return { numeratorSource, denominatorFields, scaleFactor }
      }
    }
  } catch {}
  return { numeratorSource: FIXED_NUMERATOR, denominatorFields: ['NUM_QUESTIONS', 'MAX_RATING'], scaleFactor: 100 }
}

function buildDefinition(node: ExpressionNode): string {
  const denominatorLeft = node.denominatorFields[0] || 'NUM_QUESTIONS'
  const denominatorRight = node.denominatorFields[1] || 'MAX_RATING'
  return JSON.stringify({
    expression: {
      type: 'multiply',
      left: {
        type: 'divide',
        left: { type: 'input', name: node.numeratorSource },
        right: {
          type: 'multiply',
          left: { type: 'input', name: denominatorLeft },
          right: { type: 'input', name: denominatorRight },
        },
      },
      right: { type: 'literal', value: node.scaleFactor },
    },
  })
}

export default function FormulaBuilderDialog({
  open,
  onClose,
  onSave,
  formula,
  area,
}: FormulaBuilderDialogProps) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [expressionNode, setExpressionNode] = useState<ExpressionNode>({
    numeratorSource: FIXED_NUMERATOR,
    denominatorFields: ['NUM_QUESTIONS', 'MAX_RATING'],
    scaleFactor: 100,
  })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (formula) {
      setName(formula.name)
      setDescription(formula.description ?? '')
      setExpressionNode(parseDefinition(formula.definition))
    } else {
      setName('')
      setDescription('')
      setExpressionNode({
        numeratorSource: FIXED_NUMERATOR,
        denominatorFields: ['NUM_QUESTIONS', 'MAX_RATING'],
        scaleFactor: 100,
      })
    }
  }, [formula, open])

  const handleSave = async () => {
    setSaving(true)
    try {
      await onSave({
        name,
        description,
        definition: buildDefinition(expressionNode),
      })
    } finally {
      setSaving(false)
    }
  }

  const canSave = name.trim().length > 0

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>{formula ? 'Edit Formula' : 'Create Formula'} — {area.replace('_', ' ')}</DialogTitle>
      <DialogContent>
        <Stack spacing={3} sx={{ mt: 1 }}>
          <TextField
            label="Formula Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            fullWidth
          />
          <TextField
            label="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            multiline
            rows={2}
            fullWidth
          />

          <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
            Formula Expression
          </Typography>

          <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 1, border: '1px solid', borderColor: 'divider' }}>
            <Typography variant="body2" sx={{ fontFamily: 'monospace', mb: 1, color: 'text.secondary' }}>
              score = (
              <Chip
                label={expressionNode.numeratorSource}
                size="small"
                color="primary"
                sx={{ mx: 0.5, fontFamily: 'monospace' }}
              />
              {' / ('}
              {expressionNode.denominatorFields.map((f, i) => (
                <span key={f}>
                  {i > 0 && <span> × </span>}
                  <Chip label={f} size="small" color="secondary" sx={{ mx: 0.5, fontFamily: 'monospace' }} />
                </span>
              ))}
              )) × <Chip label={expressionNode.scaleFactor} size="small" color="success" sx={{ mx: 0.5, fontFamily: 'monospace' }} />
            </Typography>
          </Box>

          <Stack spacing={2}>
            <FormControl size="small" fullWidth>
              <InputLabel>Numerator (Sum of)</InputLabel>
              <Select
                value={expressionNode.numeratorSource}
                label="Numerator (Sum of)"
                onChange={(e) =>
                  setExpressionNode((prev) => ({ ...prev, numeratorSource: e.target.value }))
                }
              >
                {INPUT_OPTIONS.filter((o) => o.value === FIXED_NUMERATOR).map((opt) => (
                  <MenuItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <Stack direction="row" spacing={2}>
              {expressionNode.denominatorFields.map((field, index) => (
                <FormControl key={index} size="small" fullWidth>
                  <InputLabel>Denominator Field {index + 1}</InputLabel>
                  <Select
                    value={field}
                    label={`Denominator Field ${index + 1}`}
                    onChange={(e) => {
                      const newFields = [...expressionNode.denominatorFields]
                      newFields[index] = e.target.value
                      setExpressionNode((prev) => ({ ...prev, denominatorFields: newFields }))
                    }}
                  >
                    {INPUT_OPTIONS.filter((o) => o.value !== expressionNode.numeratorSource).map((opt) => (
                      <MenuItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              ))}
            </Stack>

            <TextField
              label="Scale Factor (multiplier)"
              type="number"
              size="small"
              value={expressionNode.scaleFactor}
              onChange={(e) =>
                setExpressionNode((prev) => ({
                  ...prev,
                  scaleFactor: parseInt(e.target.value) || 100,
                }))
              }
              sx={{ maxWidth: 200 }}
            />
          </Stack>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={handleSave} disabled={!canSave || saving}>
          {saving ? 'Saving...' : formula ? 'Update' : 'Create'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
