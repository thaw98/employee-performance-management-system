interface EmployeeStepperProps {
  currentStep: 1 | 2 | 3
}

function StepCircle({
  number,
  completed,
  active,
}: {
  number: number
  completed: boolean
  active: boolean
}) {
  return (
    <div
      className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold transition-all duration-300 ${
        completed
          ? 'bg-emerald-500 text-white shadow-md shadow-emerald-200'
          : active
            ? 'bg-blue-600 text-white shadow-md shadow-blue-200'
            : 'border-2 border-slate-200 bg-white text-slate-400'
      }`}
    >
      {completed ? <i className="bi bi-check-lg text-base" /> : number}
    </div>
  )
}

function Connector({ complete }: { complete: boolean }) {
  return (
    <div
      className={`mt-5 h-0.5 min-w-4 flex-1 rounded-full transition-colors duration-500 ${
        complete ? 'bg-emerald-300' : 'bg-slate-200'
      }`}
    />
  )
}

export function EmployeeStepper({ currentStep }: EmployeeStepperProps) {
  const step1Done = currentStep >= 2
  const step2Done = currentStep >= 3
  const step1Active = currentStep === 1
  const step2Active = currentStep === 2
  const step3Active = currentStep === 3

  return (
    <div className="mb-8 flex w-full items-start">
      {/* Step 1 */}
      <div className="flex min-w-0 max-w-30 flex-1 flex-col items-center sm:max-w-none sm:flex-none">
        <StepCircle number={1} completed={step1Done} active={step1Active} />
        <div className="mt-2 text-center">
          <p
            className={`text-sm font-semibold leading-tight ${
              step1Active ? 'text-blue-700' : step1Done ? 'text-emerald-700' : 'text-slate-400'
            }`}
          >
            Employee Info
          </p>
          <p className={`mt-0.5 text-xs ${step1Active || step1Done ? 'text-slate-500' : 'text-slate-300'}`}>
            Personal, family & contact
          </p>
        </div>
      </div>

      <Connector complete={step1Done} />

      {/* Step 2 */}
      <div className="flex min-w-0 max-w-30 flex-1 flex-col items-center sm:max-w-none sm:flex-none">
        <StepCircle number={2} completed={step2Done} active={step2Active} />
        <div className="mt-2 text-center">
          <p
            className={`text-sm font-semibold leading-tight ${
              step2Active ? 'text-blue-700' : step2Done ? 'text-emerald-700' : 'text-slate-400'
            }`}
          >
            Employment Details
          </p>
          <p className={`mt-0.5 text-xs ${step2Active || step2Done ? 'text-slate-500' : 'text-slate-300'}`}>
            Role & Joining
          </p>
        </div>
      </div>

      <Connector complete={step2Done} />

      {/* Step 3 */}
      <div className="flex min-w-0 max-w-30 flex-1 flex-col items-center sm:max-w-none sm:flex-none">
        <StepCircle number={3} completed={false} active={step3Active} />
        <div className="mt-2 text-center">
          <p className={`text-sm font-semibold leading-tight ${step3Active ? 'text-blue-700' : 'text-slate-400'}`}>
            Account Creation
          </p>
          <p className={`mt-0.5 text-xs ${step3Active ? 'text-slate-500' : 'text-slate-300'}`}>
            Login credentials
          </p>
        </div>
      </div>
    </div>
  )
}
