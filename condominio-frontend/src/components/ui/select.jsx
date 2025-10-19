import { useState, createContext, useContext } from 'react'

const SelectContext = createContext()

export const Select = ({ children, value, onValueChange, ...props }) => {
  const [isOpen, setIsOpen] = useState(false)
  const [selectedValue, setSelectedValue] = useState(value || '')
  
  const handleValueChange = (newValue) => {
    setSelectedValue(newValue)
    setIsOpen(false)
    if (onValueChange) onValueChange(newValue)
  }
  
  return (
    <SelectContext.Provider value={{ isOpen, setIsOpen, selectedValue, handleValueChange }}>
      <div className="relative" {...props}>
        {children}
      </div>
    </SelectContext.Provider>
  )
}

export const SelectTrigger = ({ children, className = '', ...props }) => {
  const { isOpen, setIsOpen } = useContext(SelectContext)
  
  return (
    <button
      type="button"
      className={`flex h-10 w-full items-center justify-between rounded-md border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
      onClick={() => setIsOpen(!isOpen)}
      {...props}
    >
      {children}
    </button>
  )
}

export const SelectValue = ({ placeholder, className = '', ...props }) => {
  const { selectedValue } = useContext(SelectContext)
  
  return (
    <span className={className} {...props}>
      {selectedValue || placeholder}
    </span>
  )
}

export const SelectContent = ({ children, className = '', ...props }) => {
  const { isOpen } = useContext(SelectContext)
  
  if (!isOpen) return null
  
  return (
    <div className={`absolute top-full left-0 z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto ${className}`} {...props}>
      {children}
    </div>
  )
}

export const SelectItem = ({ children, value, className = '', ...props }) => {
  const { handleValueChange } = useContext(SelectContext)
  
  return (
    <div
      className={`relative flex cursor-pointer select-none items-center py-2 px-3 text-sm hover:bg-gray-100 ${className}`}
      onClick={() => handleValueChange(value)}
      {...props}
    >
      {children}
    </div>
  )
}