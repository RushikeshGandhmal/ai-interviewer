"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "./ui/textarea";
import pdfToText from "react-pdftotext";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useRouter } from "next/navigation";
import { useState } from "react";

const formSchema = z.object({
  jobDescription: z.string().min(1, "Job description is required"),
  resume: z.instanceof(File, { message: "Resume is required" }),
  role: z.string().min(1, "Role is required"),
  type: z.enum(["technical", "behavioral", "mixed"], {
    errorMap: () => ({ message: "Select an interview type" }),
  }),
  techstack: z.string().min(1, "Tech stack is required"),
  level: z.enum(["junior", "mid", "senior"], {
    errorMap: () => ({ message: "Select a job experience level" }),
  }),
  amount: z
    .number({
      required_error: "Number of questions is required",
      invalid_type_error: "Must be a number",
    })
    .min(1, "Minimum 1 question")
    .max(15, "Maximum 15 questions"),
});

type FormValues = z.infer<typeof formSchema>;

const InterviewForm = ({ userId }: { userId: string }) => {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      jobDescription: "",
      role: "",
      amount: 5,
      techstack: "",
    },
  });

  const onSubmit = async (data: FormValues) => {
    setIsSubmitting(true);

    try {
      const resumeText = await pdfToText(data.resume);

      const payload = {
        ...data,
        resumeText,
        userid: userId,
      };

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_PROJECT_URL}/api/vapi/generate`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to generate interview questions");
      }

      await response.json();
      router.push("/");
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-xl w-full mx-auto mt-12 px-6 py-8 bg-white text-black dark:bg-neutral-900 dark:text-white rounded-xl shadow-md">
      <h2 className="text-3xl font-extrabold text-center text-indigo-600 dark:text-indigo-400 mb-8 tracking-tight">
        🚀 Interview Generation Details
      </h2>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Role input */}
          <FormField
            control={form.control}
            name="role"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="font-medium">Target Role</FormLabel>
                <FormControl>
                  <Input
                    className="w-full"
                    placeholder="e.g. Frontend Developer"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Interview type dropdown */}
          <FormField
            control={form.control}
            name="type"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="font-medium">Interview Type</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="technical">Technical</SelectItem>
                    <SelectItem value="behavioral">Behavioral</SelectItem>
                    <SelectItem value="mixed">Mixed</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Experience level dropdown */}
          <FormField
            control={form.control}
            name="level"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="font-medium">Experience Level</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select level" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="junior">Junior</SelectItem>
                    <SelectItem value="mid">Mid</SelectItem>
                    <SelectItem value="senior">Senior</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Question count input */}
          <FormField
            control={form.control}
            name="amount"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="font-medium">
                  How many questions? (max 15)
                </FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min={1}
                    max={15}
                    className="w-full"
                    {...field}
                    onChange={(e) => field.onChange(Number(e.target.value))}
                    placeholder="e.g. 5"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="techstack"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="font-medium">
                  Technologies to Cover
                </FormLabel>
                <FormControl>
                  <Input
                    className="w-full"
                    placeholder="e.g. React, Node.js, PostgreSQL"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Job Description */}
          <FormField
            control={form.control}
            name="jobDescription"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="font-medium">Job Description</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Paste or describe the job responsibilities"
                    className="w-full min-h-[120px] resize-none"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Resume Upload */}
          <FormField
            control={form.control}
            name="resume"
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            render={({ field: { value, onChange, ...field } }) => (
              <FormItem>
                <FormLabel className="font-medium">
                  Upload Resume (PDF)
                </FormLabel>
                <FormControl>
                  <Input
                    type="file"
                    accept=".pdf"
                    className="w-full"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      onChange(file);
                    }}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button
            type="submit"
            className="w-full text-base font-semibold cursor-pointer"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Submitting..." : "Submit"}
          </Button>
        </form>
      </Form>
    </div>
  );
};

export default InterviewForm;
