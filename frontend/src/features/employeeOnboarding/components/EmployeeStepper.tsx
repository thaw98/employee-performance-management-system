interface EmployeeStepperProps {
  currentStep: 1 | 2
  step1Completed: boolean
}

export function EmployeeStepper({ currentStep, step1Completed }: EmployeeStepperProps) {
  const step1Active = currentStep === 1
  const step2Active = currentStep === 2

  return (
    <div className="mb-8 flex items-start">
      {/* Step 1 */}
      <div className="flex min-w-35 flex-col items-center">
        <div
          className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold transition-all duration-300 ${
            step1Completed
              ? 'bg-emerald-500 text-white shadow-md shadow-emerald-200'
              : step1Active
              ? 'bg-blue-600 text-white shadow-md shadow-blue-200'
              : 'border-2 border-slate-200 bg-white text-slate-400'
          }`}
        >
          {step1Completed ? <i className="bi bi-check-lg text-base" /> : '1'}
        </div>
        <div className="mt-2 text-center">
          <p
            className={`text-sm font-semibold leading-tight ${
              step1Active ? 'text-blue-700' : step1Completed ? 'text-emerald-700' : 'text-slate-400'
            }`}
          >
            Employee Information
          </p>
          <p className={`mt-0.5 text-xs ${step1Active || step1Completed ? 'text-slate-500' : 'text-slate-300'}`}>
            Personal &amp; employment details
          </p>
        </div>
      </div>

      {/* Connector */}
      <div
        className={`mt-5 h-0.5 flex-1 rounded-full transition-colors duration-500 ${
          step1Completed ? 'bg-emerald-300' : 'bg-slate-200'
        }`}
      />

      {/* Step 2 */}
      <div className="flex min-w-35 flex-col items-center">
        <div
          className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold transition-all duration-300 ${
            step2Active
              ? 'bg-blue-600 text-white shadow-md shadow-blue-200'
              : 'border-2 border-slate-200 bg-white text-slate-400'
          }`}
        >
          2
        </div>
        <div className="mt-2 text-center">
          <p className={`text-sm font-semibold leading-tight ${step2Active ? 'text-blue-700' : 'text-slate-400'}`}>
            Account Creation
          </p>
          <p className={`mt-0.5 text-xs ${step2Active ? 'text-slate-500' : 'text-slate-300'}`}>
            Generate login credentials
          </p>
        </div>
      </div>
    </div>
  )
}

