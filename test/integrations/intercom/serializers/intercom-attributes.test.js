const serializeAttributes = require('../../../../src/integrations/intercom/serializers/intercom-attributes');

describe('integrations > intercom > serializers > intercom-attributes', () => {
  describe('on an empty object', () => {
    it('should return a JSONAPI version of the empty object', () => {
      expect.assertions(1);

      const serializedIntercomAttributes = serializeAttributes({}, 'x', {});

      expect(serializedIntercomAttributes).toStrictEqual({
        data: {
          type: 'x_intercom_attributes',
        },
        meta: {},
      });
    });
  });

  describe('with a classic intercom payload', () => {
    it('should format the intercom response as JSONAPI', () => {
      expect.assertions(1);

      // Most of theses fields are "useless", but this is the look of
      // a response sent by intercom/services/attributes-getter.js
      const intercomAttributes = {
        type: 'contact',
        id: 'id',
        workspace_id: 'workspace_id',
        external_id: null,
        role: 'user',
        email: 'test@test.fr',
        phone: null,
        name: 'Username 1',
        avatar: null,
        owner_id: null,
        social_profiles: { type: 'list', data: [] },
        has_hard_bounced: false,
        marked_email_as_spam: false,
        unsubscribed_from_emails: false,
        created_at: null,
        updated_at: null,
        signed_up_at: null,
        last_seen_at: null,
        last_replied_at: null,
        last_contacted_at: null,
        last_email_opened_at: null,
        last_email_clicked_at: null,
        language_override: null,
        browser: null,
        browser_version: null,
        browser_language: null,
        os: null,
        location: {
          type: 'location',
          country: null,
          region: null,
          city: null,
        },
        android_app_name: null,
        android_app_version: null,
        android_device: null,
        android_os_version: null,
        android_sdk_version: null,
        android_last_seen_at: null,
        ios_app_name: null,
        ios_app_version: null,
        ios_device: null,
        ios_os_version: null,
        ios_sdk_version: null,
        ios_last_seen_at: null,
        custom_attributes: {},
        city: null,
        country: null,
      };

      const serializedIntercomAttributes = serializeAttributes(intercomAttributes, 'x', {});

      expect(serializedIntercomAttributes).toStrictEqual({
        data: {
          type: 'x_intercom_attributes',
          attributes: {
            browser: null,
            city: null,
            country: null,
            created_at: null,
            email: 'test@test.fr',
            last_contacted_at: null,
            last_email_clicked_at: null,
            last_email_opened_at: null,
            last_replied_at: null,
            last_seen_at: null,
            name: 'Username 1',
            role: 'user',
            signed_up_at: null,
            updated_at: null,
          },
          id: 'id',
        },
        meta: {},
      });
    });

    describe('when there are dates in the response', () => {
      it('should correctly format the date from unix timestamp', () => {
        expect.assertions(6);

        const intercomAttributes = {
          updated_at: null,
          created_at: 1586853350,
          email: 'test@test.fr',
        };
        const serializedIntercomAttributes = serializeAttributes(intercomAttributes, 'x', {});

        expect(serializedIntercomAttributes).toBeDefined();
        expect(serializedIntercomAttributes.data).toBeDefined();
        const serializedAttributes = serializedIntercomAttributes.data.attributes;
        expect(serializedAttributes).toBeDefined();
        expect(serializedAttributes.updated_at).toBeNull();
        expect(serializedAttributes.created_at).toStrictEqual(new Date(1586853350000));
        expect(serializedAttributes.email)
          .toStrictEqual(intercomAttributes.email);
      });
    });
  });
});
