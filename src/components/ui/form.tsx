"use client"

import * as React from "react"
import * as LabelPrimitive from "@radix-ui/react-label"
// Slot is no longer used by FormControl, but other parts of the form system might use it implicitly or if you extend it.
// For now, keeping it commented out if not directly used by the exported components here.
// import { Slot } from "@radix-ui/react-slot" 
import {
  Controller,
  FormProvider,
  useFormContext,
  type ControllerProps,
  type FieldPath,
  type FieldValues,
} from "react-hook-form"

import { cn } from "@/lib/utils"
import { Label } from "@/components/ui/label"

const Form = FormProvider

type FormFieldContextValue<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
> = {
  name: TName
}

const FormFieldContext = React.createContext<FormFieldContextValue>(
  {} as FormFieldContextValue
)

const FormField = <
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
>({
  ...props
}: ControllerProps<TFieldValues, TName>) => {
  return (
    <FormFieldContext.Provider value={{ name: props.name }}>
      <Controller {...props} />
    </FormFieldContext.Provider>
  )
}

const useFormField = () => {
  const fieldContext = React.useContext(FormFieldContext)
  const itemContext = React.useContext(FormItemContext)
  const { getFieldState, formState } = useFormContext()

  const fieldState = getFieldState(fieldContext.name, formState)

  if (!fieldContext) {
    throw new Error("useFormField should be used within <FormField>")
  }

  const { id } = itemContext

  return {
    id,
    name: fieldContext.name,
    formItemId: `${id}-form-item`,
    formDescriptionId: `${id}-form-item-description`,
    formMessageId: `${id}-form-item-message`,
    ...fieldState,
  }
}

type FormItemContextValue = {
  id: string
}

const FormItemContext = React.createContext<FormItemContextValue>(
  {} as FormItemContextValue
)

const FormItem = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  const id = React.useId()

  return (
    <FormItemContext.Provider value={{ id }}>
      <div ref={ref} className={cn("space-y-2", className)} {...props} />
    </FormItemContext.Provider>
  )
})
FormItem.displayName = "FormItem"

const FormLabel = React.forwardRef<
  React.ElementRef<typeof LabelPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root>
>(({ className, ...props }, ref) => {
  const { error, formItemId } = useFormField()

  return (
    <Label
      ref={ref}
      className={cn(error && "text-destructive", className)}
      htmlFor={formItemId}
      {...props}
    />
  )
})
FormLabel.displayName = "FormLabel"

const FormControl = React.forwardRef<
  // The ref type now more generically refers to an HTMLElement,
  // as we don't know the exact type of the child beforehand.
  HTMLElement,
  // Props for FormControl: accept children and any other HTML attributes.
  React.PropsWithChildren<Omit<React.HTMLAttributes<HTMLElement>, 'children'>>
>(({ children, ...props }, ref) => {
  const { error, formItemId, formDescriptionId, formMessageId } = useFormField();

  // React.Children.only will throw if children is not a single element.
  // This is the same check Slot would implicitly do.
  const child = React.Children.only(children);

  if (React.isValidElement(child)) {
    // These are the props FormControl is responsible for adding.
    const newProps: Record<string, any> = {
      ...props, // Pass through any other props passed to FormControl
      id: formItemId,
      'aria-describedby': !error
        ? formDescriptionId
        : `${formDescriptionId} ${formMessageId}`,
      'aria-invalid': !!error,
    };
    
    // The `ref` passed to `FormControl` (via `React.forwardRef`) is intended for
    // the underlying interactive element if needed by the parent of FormControl.
    // react-hook-form's `field.ref` is already on the `child` (e.g. <Input {...field} />).
    // `React.cloneElement` will preserve the `ref` on `child` unless `newProps.ref` is also set.
    // If `ref` (from `forwardRef`) is provided to `FormControl`, we should merge it.
    // React handles ref merging if `child` is a `forwardRef` component or class component.
    if (ref) {
      newProps.ref = ref;
    }

    return React.cloneElement(child as React.ReactElement<any>, newProps);
  }

  // Fallback or error if children is not a single valid element.
  // This case should ideally not be reached if used correctly.
  // Returning null might suppress errors but hide problems.
  // Throwing an error is consistent with React.Children.only's behavior.
  if (children === null || children === undefined) return null;
  
  // If children is not null/undefined but also not a single valid element,
  // React.Children.only would have already thrown.
  // This line is more of a defensive fallback.
  return <>{children}</>; 
});
FormControl.displayName = "FormControl"


const FormDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => {
  const { formDescriptionId } = useFormField()

  return (
    <p
      ref={ref}
      id={formDescriptionId}
      className={cn("text-sm text-muted-foreground", className)}
      {...props}
    />
  )
})
FormDescription.displayName = "FormDescription"

const FormMessage = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, children, ...props }, ref) => {
  const { error, formMessageId } = useFormField()
  const body = error ? String(error?.message ?? "") : children

  if (!body) {
    return null
  }

  return (
    <p
      ref={ref}
      id={formMessageId}
      className={cn("text-sm font-medium text-destructive", className)}
      {...props}
    >
      {body}
    </p>
  )
})
FormMessage.displayName = "FormMessage"

export {
  useFormField,
  Form,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage,
  FormField,
}
