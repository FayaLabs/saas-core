import React from 'react'
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalTitle,
  ModalDescription,
  ModalFooter,
} from '../ui/modal'
import { Button } from '../ui/button'

interface DeleteConfirmDialogProps {
  open: boolean
  onClose: () => void
  onConfirm: () => void
  entityName: string
  displayValue?: string
}

export function DeleteConfirmDialog({ open, onClose, onConfirm, entityName, displayValue }: DeleteConfirmDialogProps) {
  return (
    <Modal open={open} onOpenChange={(isOpen) => { if (!isOpen) onClose() }}>
      <ModalContent>
        <ModalHeader>
          <ModalTitle>Delete {entityName}?</ModalTitle>
          <ModalDescription>
            {displayValue
              ? `Are you sure you want to delete "${displayValue}"? This action cannot be undone.`
              : `Are you sure you want to delete this ${entityName.toLowerCase()}? This action cannot be undone.`}
          </ModalDescription>
        </ModalHeader>
        <ModalFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button variant="destructive" onClick={onConfirm}>Delete</Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}
