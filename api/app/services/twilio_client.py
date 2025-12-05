"""Async Twilio API client with retry logic and rate limiting."""
import httpx
import asyncio
import base64
from typing import List, Dict, Optional, Any
from datetime import datetime
import logging

logger = logging.getLogger(__name__)


class TwilioAPIError(Exception):
    """Base exception for Twilio API errors."""
    pass


class TwilioRateLimitError(TwilioAPIError):
    """Exception for rate limit errors."""
    pass


class TwilioClient:
    """Async client for Twilio API with retry logic."""
    
    BASE_URL = "https://api.twilio.com"
    NUMBERS_BASE_URL = "https://numbers.twilio.com"
    
    def __init__(self, account_sid: str, auth_token: str, max_retries: int = 3):
        """
        Initialize Twilio client.
        
        Args:
            account_sid: Twilio Account SID
            auth_token: Twilio Auth Token
            max_retries: Maximum number of retry attempts
        """
        self.account_sid = account_sid
        self.auth_token = auth_token
        self.max_retries = max_retries
        
        # Create base64 encoded credentials for Basic Auth
        credentials = f"{account_sid}:{auth_token}"
        encoded_credentials = base64.b64encode(credentials.encode()).decode()
        self.auth_header = f"Basic {encoded_credentials}"
        
        # Create httpx client with timeout
        self.client = httpx.AsyncClient(
            timeout=httpx.Timeout(30.0),
            headers={
                "Authorization": self.auth_header,
                "Accept": "application/json",
            },
        )
    
    async def close(self):
        """Close the HTTP client."""
        await self.client.aclose()
    
    async def _make_request(
        self,
        method: str,
        url: str,
        retry_count: int = 0,
        **kwargs
    ) -> httpx.Response:
        """
        Make HTTP request with retry logic and rate limit handling.
        
        Args:
            method: HTTP method
            url: Request URL
            retry_count: Current retry attempt
            **kwargs: Additional arguments for httpx request
            
        Returns:
            httpx.Response object
            
        Raises:
            TwilioRateLimitError: If rate limited
            TwilioAPIError: For other API errors
        """
        try:
            response = await self.client.request(method, url, **kwargs)
            
            # Handle rate limiting (429)
            if response.status_code == 429:
                retry_after = int(response.headers.get("Retry-After", "60"))
                logger.warning(f"Rate limited. Retrying after {retry_after} seconds...")
                
                if retry_count < self.max_retries:
                    await asyncio.sleep(retry_after)
                    return await self._make_request(method, url, retry_count + 1, **kwargs)
                else:
                    raise TwilioRateLimitError(f"Rate limit exceeded after {self.max_retries} retries")
            
            # Handle other errors
            response.raise_for_status()
            return response
            
        except httpx.HTTPStatusError as e:
            if e.response.status_code == 429:
                raise TwilioRateLimitError(f"Rate limit error: {e}")
            raise TwilioAPIError(f"API error: {e}")
        except httpx.RequestError as e:
            # Retry on network errors
            if retry_count < self.max_retries:
                wait_time = 2 ** retry_count  # Exponential backoff
                logger.warning(f"Request error, retrying in {wait_time} seconds...")
                await asyncio.sleep(wait_time)
                return await self._make_request(method, url, retry_count + 1, **kwargs)
            raise TwilioAPIError(f"Request error after {self.max_retries} retries: {e}")
    
    async def list_countries(self) -> List[Dict[str, Any]]:
        """
        Fetch all countries with available phone numbers.
        Handles pagination automatically.
        
        Returns:
            List of country dictionaries
        """
        url = f"{self.BASE_URL}/2010-04-01/Accounts/{self.account_sid}/AvailablePhoneNumbers.json"
        all_countries = []
        
        while url:
            response = await self._make_request("GET", url)
            data = response.json()
            
            # Extract countries from response
            countries = data.get("countries", [])
            all_countries.extend(countries)
            
            # Check for next page
            url = data.get("next_page_uri")
            if url:
                url = f"{self.BASE_URL}{url}"
        
        logger.info(f"Fetched {len(all_countries)} countries")
        return all_countries
    
    async def get_country_details(self, country_code: str) -> Dict[str, Any]:
        """
        Fetch details for a specific country.
        
        Args:
            country_code: ISO country code (e.g., "US")
            
        Returns:
            Country details dictionary with subresource_uris
        """
        url = f"{self.BASE_URL}/2010-04-01/Accounts/{self.account_sid}/AvailablePhoneNumbers/{country_code}.json"
        
        response = await self._make_request("GET", url)
        data = response.json()
        
        return data
    
    def extract_number_types(self, country_data: Dict[str, Any]) -> Dict[str, bool]:
        """
        Extract available number types from country data.
        
        Args:
            country_data: Country data from Twilio API
            
        Returns:
            Dictionary mapping number type names to availability (boolean)
        """
        subresource_uris = country_data.get("subresource_uris", {})
        
        return {
            "local": "local" in subresource_uris,
            "toll_free": "toll_free" in subresource_uris,
            "mobile": "mobile" in subresource_uris,
            "national": "national" in subresource_uris,
            "voip": "voip" in subresource_uris,
            "shared_cost": "shared_cost" in subresource_uris,
            "machine_to_machine": "machine_to_machine" in subresource_uris,
        }
    
    async def list_regulations(
        self,
        country_code: str,
        number_type: Optional[str] = None,
        include_constraints: bool = True
    ) -> List[Dict[str, Any]]:
        """
        Fetch regulatory compliance regulations for a country.
        Always sets EndUserType to 'business'.
        Handles pagination automatically.
        
        Args:
            country_code: ISO country code (e.g., "US")
            number_type: Optional number type filter (e.g., "mobile", "local")
            include_constraints: Whether to include detailed requirements (default: True)
            
        Returns:
            List of regulation dictionaries
        """
        # Use the numbers.twilio.com domain for regulatory compliance API
        base_url = "https://numbers.twilio.com"
        url = f"{base_url}/v2/RegulatoryCompliance/Regulations"
        
        # Build query parameters
        params = {
            "EndUserType": "business",  # Always set to business
            "IsoCountry": country_code,
            "IncludeConstraints": str(include_constraints).lower(),
        }
        
        if number_type:
            params["NumberType"] = number_type
        
        all_regulations = []
        
        while url:
            # Make request with current URL and params
            response = await self._make_request("GET", url, params=params)
            data = response.json()
            
            # Extract regulations from response
            regulations = data.get("results", [])
            all_regulations.extend(regulations)
            
            # Check for next page
            next_page_url = data.get("meta", {}).get("next_page_url")
            if next_page_url:
                url = next_page_url
                # Clear params for subsequent requests (they're in the URL)
                params = {}
            else:
                url = None
        
        logger.info(f"Fetched {len(all_regulations)} regulations for country {country_code}")
        return all_regulations
    
    async def search_available_numbers(
        self,
        country_code: str,
        number_type: str,
        sms_enabled: Optional[bool] = None,
        voice_enabled: Optional[bool] = None
    ) -> List[Dict[str, Any]]:
        """
        Search for available phone numbers by country and number type.
        Handles pagination automatically.
        
        Args:
            country_code: ISO country code (e.g., "US")
            number_type: Number type - "mobile", "local", or "toll-free"
            sms_enabled: Optional filter for SMS capability (True/False)
            voice_enabled: Optional filter for Voice capability (True/False)
            
        Returns:
            List of available phone number dictionaries
            
        Raises:
            TwilioAPIError: If number_type is invalid or API error occurs
        """
        # Map number type to Twilio API path format
        type_mapping = {
            "mobile": "Mobile",
            "local": "Local",
            "toll-free": "TollFree"
        }
        
        if number_type not in type_mapping:
            raise TwilioAPIError(
                f"Invalid number type: {number_type}. Must be one of: {', '.join(type_mapping.keys())}"
            )
        
        twilio_type = type_mapping[number_type]
        url = f"{self.BASE_URL}/2010-04-01/Accounts/{self.account_sid}/AvailablePhoneNumbers/{country_code}/{twilio_type}.json"
        
        # Build query parameters
        # httpx will convert boolean values to "true"/"false" strings in query params
        # Twilio API accepts boolean query parameters
        params = {}
        if sms_enabled is not None:
            params["SmsEnabled"] = sms_enabled
        if voice_enabled is not None:
            params["VoiceEnabled"] = voice_enabled
        
        logger.debug(f"Searching for {number_type} numbers in {country_code} with params: {params}")
        logger.debug(f"Request URL: {url}")
        
        all_numbers = []
        
        while url:
            # Make request with current URL and params
            response = await self._make_request("GET", url, params=params)
            
            # Log raw response for debugging
            raw_text = response.text
            logger.debug(f"Raw response (first 500 chars): {raw_text[:500]}")
            
            data = response.json()
            
            # Log response structure for debugging
            logger.debug(f"Response keys: {list(data.keys())}")
            logger.debug(f"Response status: {response.status_code}")
            
            # Extract available numbers from response
            numbers = data.get("available_phone_numbers", [])
            
            # Log detailed response info
            logger.info(f"Response contains {len(numbers)} numbers")
            if numbers:
                logger.info(f"First number example: {numbers[0] if numbers else 'N/A'}")
            else:
                # Log full response when empty to debug
                logger.warning(f"No numbers found. Response keys: {list(data.keys())}")
                # Log the actual value of available_phone_numbers
                if "available_phone_numbers" in data:
                    av_nums = data["available_phone_numbers"]
                    logger.warning(f"available_phone_numbers type: {type(av_nums)}, value: {av_nums}")
                # Log full response structure
                import json
                logger.warning(f"Full response JSON: {json.dumps(data, indent=2)[:2000]}")
                # Check pagination info
                logger.info(f"Page info - page: {data.get('page')}, page_size: {data.get('page_size')}, end: {data.get('end')}, start: {data.get('start')}")
            
            all_numbers.extend(numbers)
            
            # Check for next page
            next_page_uri = data.get("next_page_uri")
            if next_page_uri:
                url = f"{self.BASE_URL}{next_page_uri}"
                # Clear params for subsequent requests (they're in the URL)
                params = {}
            else:
                url = None
        
        logger.info(f"Fetched {len(all_numbers)} available {number_type} numbers for country {country_code}")
        return all_numbers

