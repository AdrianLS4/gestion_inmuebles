import { useState, createContext, useContext } from 'react'

const AlertDialogContext = createContext()

export const AlertDialog = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false)
  
  return (
    <AlertDialogContext.Provider value={{ isOpen, setIsOpen }}>
      {children}
    </AlertDialogContext.Provider>
  )
}

export const AlertDialogTrigger = ({ children, asChild, ...props }) => {
  const { setIsOpen } = useContext(AlertDialogContext)
  
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

export const AlertDialogContent = ({ children, className = '', ...props }) => {
  const { isOpen, setIsOpen } = useContext(AlertDialogContext)
  
  if (!isOpen) return null
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50" onClick={() => setIsOpen(false)}>
      <div className={`relative bg-white rounded-lg shadow-lg p-6 w-full max-w-md mx-4 ${className}`} onClick={(e) => e.stopPropagation()} {...props}>
        {children}
      </div>
    </div>
  )
}

export const AlertDialogHeader = ({ children, className = '', ...props }) => (
  <div className={`flex flex-col space-y-2 text-center sm:text-left ${className}`} {...props}>
    {children}
  </div>
)

export const AlertDialogTitle = ({ children, className = '', ...props }) => (
  <h2 className={`text-lg font-semibold ${className}`} {...props}>
    {children}
  </h2>
)

export const AlertDialogDescription = ({ children, className = '', ...props }) => (
  <p className={`text-sm text-gray-500 ${className}`} {...props}>
    {children}
  </p>
)

export const AlertDialogFooter = ({ children, className = '', ...props }) => (
  <div className={`flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 mt-4 ${className}`} {...props}>
    {children}
  </div>
)

export const AlertDialogCancel = ({ children, className = '', ...props }) => {
  const { setIsOpen } = useContext(AlertDialogContext)
  
  return (
    <button
      className={`inline-flex h-10 items-center justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium hover:bg-gray-50 ${className}`}
      onClick={() => setIsOpen(false)}
      {...props}
    >
      {children}
    </button>
  )
}

export const AlertDialogAction = ({ children, className = '', onClick, ...props }) => {
  const { setIsOpen } = useContext(AlertDialogContext)
  
  const handleClick = (e) => {
    if (onClick) onClick(e)
    setIsOpen(false)
  }
  
  return (
    <button
      className={`inline-flex h-10 items-center justify-center rounded-md px-4 py-2 text-sm font-medium ${className}`}
      onClick={handleClick}
      {...props}
    >
      {children}
    </button>
  )
}