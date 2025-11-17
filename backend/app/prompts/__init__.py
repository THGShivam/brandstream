"""
Prompt management utilities
"""
from pathlib import Path
from typing import Dict


class PromptLoader:
    """Utility class to load and format prompt templates"""

    _prompts_dir = Path(__file__).parent
    _cache: Dict[str, str] = {}

    @classmethod
    def load(cls, prompt_name: str, **kwargs) -> str:
        """
        Load a prompt template and format it with provided kwargs

        Args:
            prompt_name: Name of the prompt file (without .txt extension)
            **kwargs: Variables to format the prompt with

        Returns:
            Formatted prompt string
        """
        # Load from cache or file
        if prompt_name not in cls._cache:
            prompt_path = cls._prompts_dir / f"{prompt_name}.txt"
            if not prompt_path.exists():
                raise FileNotFoundError(f"Prompt template '{prompt_name}' not found")

            with open(prompt_path, 'r', encoding='utf-8') as f:
                cls._cache[prompt_name] = f.read()

        # Format the prompt with provided variables
        template = cls._cache[prompt_name]
        return template.format(**kwargs)

    @classmethod
    def clear_cache(cls):
        """Clear the prompt cache (useful for testing)"""
        cls._cache.clear()
