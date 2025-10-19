import { useState, createContext, useContext } from 'react'

const DialogContext = createContext()

export const Dialog = ({ children, open, onOpenChange }) => {
  const [isOpen, setIsOpen] = useState(open || false)
  
  const handleOpenChange = (newOpen) => {
    setIsOpen(newOpen)
    if (onOpenChange) onOpenChange(newOpen)
  }
  
  return (
    <DialogContext.Provider value={{ isOpen, setIsOpen: handleOpenChange }}>
      {children}
    </DialogContext.Provider>
  )
}

export const DialogTrigger = ({ children, asChild, ...props }) => {
  const { setIsOpen } = useContext(DialogContext)
  
  if (asChild) {
    return (
      <div onClick={() => setIsOpen(true)} style={{display: 'inline-block'}} {...props}>
        {children}
      </div>
    )
  }
  
  return (
    <button onClick={() => setIsOpen(true)} {...props}>
      {children}
    </button>
  )
}

export const DialogContent = ({ children, className = '', ...props }) => {
  const { isOpen, setIsOpen } = useContext(DialogContext)
  
  if (!isOpen) return null
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50" onClick={() => setIsOpen(false)}>
      <div className={`relative bg-white rounded-lg shadow-lg p-6 w-full max-w-md mx-4 ${className}`} onClick={(e) => e.stopPropagation()} {...props}>
        <button 
          onClick={() => setIsOpen(false)}
          className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
        >
          ✕
        </button>
        {children}
      </div>
    </div>
  )
}

export const DialogHeader = ({ children, className = '', ...props }) => (
  <div className={`flex flex-col space-y-1.5 text-center sm:text-left ${className}`} {...props}>
    {children}
  </div>
)

export const DialogTitle = ({ children, className = '', ...props }) => (
  <h2 className={`text-lg font-semibold leading-none tracking-tight ${className}`} {...props}>
    {children}
  </h2>
)

export const DialogDescription = ({ children, className = '', ...props }) => (
  <p className={`text-sm text-muted-foreground ${className}`} {...props}>
    {children}
  </p>
)

export const DialogFooter = ({ children, className = '', ...props }) => (
  <div className={`flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 ${className}`} {...props}>
    {children}
  </div>
)